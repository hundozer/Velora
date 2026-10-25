import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const host="78100500-0000-4000-8000-000000000001", guest="78100500-0000-4000-8000-000000000002", night="78100500-0000-4000-8000-000000000003";
const ok=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
function route({actor=guest,denied=false,db}) {
 const code=ts.transpileModule(readFileSync(new URL("../src/app/api/guest-list/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};
 new Function("require","module","exports",code)(name=>({
  "next/server":{NextResponse:{json:(body,{status=200,headers={}}={})=>Response.json(body,{status,headers})}},
  "@/lib/auth/serverActor":{resolveServerActor:async()=>denied?{status:"unauthenticated"}:{status:"authenticated",actor:{profileId:actor,userId:actor,accountStatus:"ACTIVE",ageVerificationStatus:"AGE_DECLARED"}},hasAdultAccess:()=>true},
  "@/lib/supabase/server":{getServerSupabase:()=>db},
  "@/lib/security/rateLimiter":{checkRateLimit:async()=>({allowed:true})},
  "@/lib/auth/durableAudit":{appendDurableAudit:async()=>true},
  "@/lib/areas.mjs":{areaById:()=>({name:"Vinohrady"})},
 })[name],m,m.exports);return m.exports;
}
function query(data) { const q={select(){return q},eq(){return q},gt(){return q},order(){return q},limit(){return q},in(){return q},or(){return q},maybeSingle:async()=>({data,error:null}),then:resolve=>Promise.resolve({data,error:null}).then(resolve)};return q; }
test("anonymous and inactive callers never access guest rows",async()=>{
 const api=route({denied:true,db:{from(){throw Error("DB touched")}}});
 for(const method of ["GET","POST","PATCH","DELETE"])assert.equal((await api[method]({nextUrl:new URL("https://example.test/api/guest-list")})).status,401);
});
test("address is returned only to the accepted, unblocked guest; host pitch stays private",async()=>{
 let accepted=true,blocked=false;
 const db={from(table){return query(table==="guest_nights"?[{id:night,host_id:host,title:"Real host night",description:"A small evening together",area_id:"praha-2",starts_at:new Date(Date.now()+86400000).toISOString(),ends_at:new Date(Date.now()+90000000).toISOString(),capacity:6,status:"PUBLISHED",exact_address:"Private address 10"}]:table==="profiles"?[{id:host,display_name:"Host",account_status:"ACTIVE",discovery_disabled:false,auth_id:host}]:table==="user_blocks"?blocked?[{blocker_id:guest,blocked_profile_id:host}]:[]:table==="guest_requests"?[{id:night,night_id:night,applicant_id:guest,status:accepted?"ACCEPTED":"REQUESTED",pitch:"Only the host can read this pitch"}]:[])} };
 const api=route({db});
 let result=await (await api.GET({nextUrl:new URL("https://example.test/api/guest-list")})).json();assert.equal(result.nights[0].address,"Private address 10");assert.equal(result.nights[0].requests,undefined);
 accepted=false;result=await (await api.GET({nextUrl:new URL("https://example.test/api/guest-list")})).json();assert.equal(result.nights[0].address,null);
 accepted=true;blocked=true;result=await (await api.GET({nextUrl:new URL("https://example.test/api/guest-list")})).json();assert.deepEqual(result.nights,[]);
});
test("publication decision uses server host identity and request RPC guards",async()=>{
 let called;const db={rpc:async(name,args)=>{called={name,args};return {data:true,error:null}}};const api=route({actor:host,db});
 assert.equal((await api.PATCH({json:async()=>({requestId:night,status:"ACCEPTED",hostId:guest})})).status,200);
 assert.equal(called.name,"intimo_guest_decide");assert.equal(called.args.p_host,host);
 assert.equal((await api.PATCH({json:async()=>({requestId:night,status:"ACCEPTED",hostId:guest})})).status,200);
 db.rpc=async()=>({data:false,error:null});assert.equal((await api.PATCH({json:async()=>({requestId:night,status:"ACCEPTED"})})).status,409);
});
