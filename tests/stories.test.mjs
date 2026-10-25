import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import ts from "typescript";
import {createHmac} from "node:crypto";
const require=createRequire(import.meta.url);
function load(path,mocks){
 const code=ts.transpileModule(readFileSync(new URL("../"+path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};new Function("require","module","exports",code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports;
}
const a="78100300-0000-4000-8000-000000000001",b="78100300-0000-4000-8000-000000000002";
const story="78100300-0000-4000-8000-000000000004";
const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const actor={profileId:a,userId:a};
function route(path,db,{denied=false,deliver=async()=>new Response("sanitized", {headers:{"Cache-Control":"private, no-store"}})}={}){
 return load(path,{
  "@/lib/stories/server":{storyActor:async()=>denied?{ok:false,response:json({error:"Denied"},401)}:{ok:true,db,actor},storyJson:json,uuid:/^[0-9a-f-]{36}$/i},
  "@/lib/security/rateLimiter":{checkRateLimit:async()=>({allowed:true})},
  "@/lib/media/delivery":{deliverMedia:deliver},"@/lib/storage/r2":{},
 });
}
test("all story operations reject anonymous requests before database/storage access",async()=>{
 const db={rpc(){throw Error("DB touched");},from(){throw Error("DB touched");}};
 for(const [path,methods] of [["src/app/api/stories/route.ts",["GET","POST"]],["src/app/api/stories/[id]/route.ts",["POST","DELETE"]],["src/app/api/stories/[id]/image/route.ts",["GET"]]]){
  const api=route(path,db,{denied:true});for(const method of methods)assert.equal((await api[method]({}, {params:{id:story}})).status,401);
 }
});
test("publication requires explicit acknowledgement and uses the server identity",async()=>{
 let args;const db={rpc:async(name,input)=>{assert.equal(name,"intimo_publish_story");args=input;return{data:story,error:null};}};
 const api=route("src/app/api/stories/route.ts",db);
 const request=body=>({json:async()=>body});
 const input={mediaId:b,audience:"SELECTED",recipients:[b],caption:"Tonight",ownerId:b};
 assert.equal((await api.POST(request(input))).status,400);assert.equal(args,undefined);
 assert.equal((await api.POST(request({...input,confirmPublish:true}))).status,201);
 assert.equal(args.p_owner,a);assert.deepEqual(args.p_recipients,[b]);
 assert.equal((await api.POST(request({...input,confirmPublish:true,recipients:[]}))).status,400);
 assert.equal((await api.POST(request({...input,confirmPublish:true,audience:"MEMBERS"}))).status,400);
});
test("summary returns only authorized RPC rows, distinguishes viewed and unseen, and forbids caching",async()=>{
 const expiry=new Date(Date.now()+10000).toISOString();
 const db={rpc:async(name,args)=>{assert.equal(args.p_viewer,a);return{data:[{owner_id:b,viewed:true,expires_at:expiry},{owner_id:b,viewed:false,expires_at:expiry}],error:null};}};
 const api=route("src/app/api/stories/route.ts",db);
 const response=await api.GET({nextUrl:new URL("https://example.test/api/stories?summary=true&owners="+b)});
 assert.equal(response.headers.get("Cache-Control"),"private, no-store");assert.deepEqual(await response.json(),{summary:{[b]:{unread:true,expiresAt:expiry}}});
 db.rpc=async()=>({data:[],error:null});
 assert.deepEqual(await (await api.GET({nextUrl:new URL("https://example.test/api/stories?summary=true&owners="+b)})).json(),{summary:{}});
 db.rpc=async()=>({data:null,error:{code:"offline"}});
 assert.equal((await api.GET({nextUrl:new URL("https://example.test/api/stories?summary=true&owners="+b)})).status,502);
});
test("denied or failed story authorization cannot read photo metadata or bytes",async()=>{
 let reads=0;
 for(const result of [{data:false,error:null},{data:null,error:{code:"offline"}}]){
  const db={rpc:async()=>result,from(){reads++;throw Error("Metadata touched");}};
  const api=route("src/app/api/stories/[id]/image/route.ts",db,{deliver:async()=>{reads++;return new Response("leak");}});
  assert.equal((await api.GET({}, {params:{id:story}})).status,404);
 }assert.equal(reads,0);
});
test("authorized story delivery uses the sanitizing proxy and fails closed on storage errors",async()=>{
 const db={rpc:async()=>({data:true,error:null}),from(table){const q={select(){return q;},eq(){return q;},single:async()=>({data:table==="member_stories"?{media_id:b}:{object_key:"stories/private",mime_type:"image/jpeg"},error:null})};return q;}};
 let called=false;const api=route("src/app/api/stories/[id]/image/route.ts",db,{deliver:async(key,mime)=>{called=true;assert.equal(key,"stories/private");assert.equal(mime,"image/jpeg");throw Error("Storage failed");}});
 assert.equal((await api.GET({}, {params:{id:story}})).status,503);assert.equal(called,true);
});
test("expired-photo cleanup preserves active stories and legal holds, and retries storage failures",async()=>{
 for(const scenario of ["active","hold","lookup-failure","storage-failure","expired"]){
  let removals=0;
  const db={rpc:async()=>({data:[{id:story,owner_id:a,object_key:"stories/private"}],error:null}),from(table){const q=new Proxy({}, {get(_,key){if(key==="then")return resolve=>resolve(table==="media_objects"?{data:null,error:null}:table==="member_stories"?{data:scenario==="active"?{expires_at:"2999-01-01",deleted_at:null}:null,error:null}:{data:scenario==="hold"?{id:b}:null,error:scenario==="lookup-failure"?{code:"offline"}:null});return()=>q;}});return q;}};
  const {cleanupStoryPhotos}=load("src/lib/stories/cleanup.ts",{"@/lib/storage/r2":{deleteStoredObject:async()=>{removals++;if(scenario==="storage-failure")throw Error("failed");},deleteVariantObjects:async()=>{}}});
  const result=await cleanupStoryPhotos(db);
  assert.equal(removals,["storage-failure","expired"].includes(scenario)?1:0);
  assert.equal(result.failed,["lookup-failure","storage-failure"].includes(scenario)?1:0);
  assert.equal(result.removed,scenario==="expired"?1:0);
 }
});
test("dedicated story cleanup requires its own purpose-specific bearer before database access",async(t)=>{
 const old=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY="synthetic-test-only";
 t.after(()=>{if(old===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=old;});
 let touches=0;
 const api=load("src/app/api/internal/stories/cleanup/route.ts",{
  "@/lib/supabase/server":{getServerSupabase:()=>{touches++;return {};}},
  "@/lib/stories/cleanup":{cleanupStoryPhotos:async()=>({removed:0,failed:0,held:0})},
 });
 for(const value of ["","Bearer wrong","Bearer "+createHmac("sha256","synthetic-test-only").update("unrelated-worker").digest("hex")]){
  assert.equal((await api.POST({headers:new Headers({authorization:value})})).status,404);
 }
 assert.equal(touches,0);
 const token=createHmac("sha256","synthetic-test-only").update("intimo-story-cleanup-v1").digest("hex");
 assert.equal((await api.POST({headers:new Headers({authorization:"Bearer "+token})})).status,200);assert.equal(touches,1);
});
