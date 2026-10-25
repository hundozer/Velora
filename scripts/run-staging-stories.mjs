// Opt-in protected Preview acceptance. Synthetic accounts and storage; guaranteed cleanup.
import assert from "node:assert/strict";
import {randomUUID,randomBytes,createHash} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {createServerClient} from "@supabase/ssr";
import {request} from "@playwright/test";
import {S3Client,DeleteObjectCommand,HeadObjectCommand} from "@aws-sdk/client-s3";
import sharp from "sharp";
const base=process.env.INTIMO_STORIES_ACCEPT_BASE;
assert.equal(process.env.VERCEL_ENV,"preview");
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,"fuczjjcwtxzzvoxilrme.supabase.co");
assert.match(base||"",/^https:\/\/velora-[a-z0-9]+-hundozers-projects\.vercel\.app$/);
assert.equal(process.env.CLOUDFLARE_R2_BUCKET_NAME,"intimo-staging-media");
for(const key of ["SUPABASE_SERVICE_ROLE_KEY","VERCEL_OIDC_TOKEN","CLOUDFLARE_R2_ACCOUNT_ID","CLOUDFLARE_R2_ACCESS_KEY_ID","CLOUDFLARE_R2_SECRET_ACCESS_KEY"])assert.ok(process.env[key],"Missing staging capability: "+key);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=process.env.CLOUDFLARE_R2_BUCKET_NAME;
const s3=new S3Client({region:"auto",endpoint:`https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,secretAccessKey:process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}});
const run=randomUUID(),password=randomBytes(30).toString("base64url"),members=[],clients=[],mediaIds=[],storyIds=[],keys=new Set();let baseline;
const protection={"x-vercel-trusted-oidc-idp-token":process.env.VERCEL_OIDC_TOKEN};
function result(r,label){if(r.error)throw Error(label+":"+(r.error.code||r.error.status||"failed"));return r.data;}
async function fingerprint(){const hashes={};for(const table of ["profiles","media_objects","member_stories","story_views"])hashes[table]=createHash("sha256").update(JSON.stringify(result(await db.from(table).select("*").order(table==="story_views"?"story_id":"id"),"baseline"))).digest("hex");return hashes;}
async function call(client,label,method,path,data,status=200){const r=await client.fetch(path,{method,data,maxRedirects:0,timeout:60000});console.log(`STORY_ACCEPT ${label} status=${r.status()}`);assert.equal(r.status(),status,label);return r;}
async function upload(owner){
 const image=await sharp({create:{width:40,height:60,channels:3,background:"#559cb4"}}).withExif({IFD0:{Make:"Synthetic test"},IFD3:{GPSLatitudeRef:"N",GPSLatitude:"50/1 5/1 0/1"}}).jpeg().toBuffer();
 const r=await call(owner.client,"presign story photo","POST","/api/media/presign-upload",{fileName:"synthetic-story-"+run+".jpg",fileType:"image/jpeg",fileSize:image.length,folder:"photos",category:"STORY",visibility:"MEMBERS_ONLY",contentRating:"NON_EXPLICIT",participantDeclaration:{containsOtherIdentifiableParticipants:false,allParticipantsAdults:true,recordingConsented:true,publicationConsented:true}});
 const p=await r.json();mediaIds.push(p.mediaId);keys.add(p.objectKey);
 assert.equal(new URL(p.uploadUrl).hostname,process.env.CLOUDFLARE_R2_ACCOUNT_ID+".r2.cloudflarestorage.com");
 const put=await fetch(p.uploadUrl,{method:"PUT",headers:{"Content-Type":"image/jpeg"},body:image,redirect:"error"});assert.equal(put.ok,true,"R2 upload");
 await call(owner.client,"complete story photo","POST",`/api/media/${p.mediaId}/complete`,{});
 const stored=result(await db.from("media_objects").select("variants").eq("id",p.mediaId).single(),"stored variants");
 for(const key of Object.values(stored.variants||{}))keys.add(key);
 assert.equal(result(await db.from("media_objects").select("visibility,category").eq("id",p.mediaId).single(),"private photo").visibility,"PRIVATE");
 return p.mediaId;
}
console.log("STORY_ACCEPT run="+run);
try{
 baseline=await fingerprint();
 const anonymous=await request.newContext({baseURL:base,extraHTTPHeaders:protection});clients.push(anonymous);
 await call(anonymous,"anonymous story list denied","GET","/api/stories",undefined,401);
 const cookies=(await anonymous.storageState()).cookies;
 for(const label of ["A","B","C"]){
  const email=`intimo-stories-${run}-${label.toLowerCase()}@example.invalid`;
  const created=result(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{intimo_stories_acceptance_run:run}}),"create fixture");
  const member={id:created.user.id,label};members.push(member);
  const jar=new Map();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(({name,value})=>jar.set(name,value))}});
  result(await auth.auth.signInWithPassword({email,password}),"login");
  const authCookies=[...jar].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:"/",expires:-1,httpOnly:false,secure:true,sameSite:"Lax"}));
  member.client=await request.newContext({baseURL:base,extraHTTPHeaders:protection,storageState:{cookies:[...cookies,...authCookies],origins:[]}});clients.push(member.client);
  await call(member.client,label+" adult declaration","POST","/api/access/age-declaration",{adult:true});
  await call(member.client,label+" onboarding","POST","/api/profile/me",{displayName:"Story fixture "+label,dateOfBirth:"1990-01-01",profileType:"SINGLE",gender:label==="A"?"FEMALE":"MALE",relationshipStatus:"SINGLE",areaId:"praha-2",lookingFor:["DATES"],messagePermission:"EVERYONE"},201);
  await call(member.client,label+" disable email","PUT","/api/notifications/preferences",{optOut:["ALL"]});
 }
 const [a,b,c]=members,photo=await upload(a);
 const input={mediaId:photo,caption:"Synthetic private story",audience:"SELECTED",recipients:[b.id],confirmPublish:true};
 await call(b.client,"wrong photo owner denied","POST","/api/stories",input,409);
 await call(a.client,"publication acknowledgement required","POST","/api/stories",{...input,confirmPublish:false},400);
 const story=(await (await call(a.client,"publish selected story","POST","/api/stories",input,201)).json()).id;storyIds.push(story);
 let data=await (await call(b.client,"pending review has no ring","GET",`/api/stories?summary=true&owners=${a.id}`)).json();assert.deepEqual(data.summary,{});
 // Synthetic photo approval only; this does not exercise a human administrator.
 result(await db.from("media_objects").update({moderation_status:"APPROVED"}).eq("id",photo).eq("owner_id",a.id),"approve synthetic");
 data=await (await call(b.client,"selected reader sees new ring","GET",`/api/stories?summary=true&owners=${a.id}`)).json();assert.equal(data.summary[a.id].unread,true);
 data=await (await call(c.client,"excluded reader sees no ring","GET",`/api/stories?summary=true&owners=${a.id}`)).json();assert.deepEqual(data.summary,{});
 const image=await call(b.client,"selected reader photo delivery","GET",`/api/stories/${story}/image`);
 assert.equal(image.headers()["cache-control"],"private, no-store");assert.equal(image.headers().location,undefined);assert.equal((await sharp(await image.body()).metadata()).exif,undefined);
 await call(c.client,"excluded direct photo denied","GET",`/api/stories/${story}/image`,undefined,404);
 await call(anonymous,"anonymous direct photo denied","GET",`/api/stories/${story}/image`,undefined,401);
 await call(b.client,"generic media route cannot bypass story","GET",`/api/media/${photo}`,undefined,404);
 await call(a.client,"story media cannot be repurposed","PATCH",`/api/media/${photo}`,{category:"ordinary",visibility:"PUBLIC"},409);
 await call(b.client,"mark story viewed","POST",`/api/stories/${story}`,{});
 data=await (await call(b.client,"viewed ring state","GET",`/api/stories?summary=true&owners=${a.id}`)).json();assert.equal(data.summary[a.id].unread,false);
 await call(b.client,"block story author","POST","/api/blocks",{targetProfileId:a.id},201);
 await call(b.client,"blocked photo denied","GET",`/api/stories/${story}/image`,undefined,404);
 await call(b.client,"unblock fixture","DELETE","/api/blocks",{targetProfileId:a.id});
 await call(a.client,"delete live story","DELETE",`/api/stories/${story}`);
 await call(b.client,"deleted photo denied","GET",`/api/stories/${story}/image`,undefined,404);
 const expiredPhoto=await upload(a);
 const expired=(await (await call(a.client,"publish expiring fixture","POST","/api/stories",{...input,mediaId:expiredPhoto},201)).json()).id;storyIds.push(expired);
 result(await db.from("media_objects").update({moderation_status:"APPROVED"}).eq("id",expiredPhoto),"approve second synthetic");
 const oldStart=Date.now()-25*3600000;
 result(await db.from("member_stories").update({created_at:new Date(oldStart).toISOString(),expires_at:new Date(oldStart+24*3600000).toISOString()}).eq("id",expired),"expire fixture");
 await call(a.client,"expired owner photo denied","GET",`/api/stories/${expired}/image`,undefined,404);
 await call(b.client,"expired reader photo denied","GET",`/api/stories/${expired}/image`,undefined,404);
 data=await (await call(b.client,"expired ring absent","GET",`/api/stories?summary=true&owners=${a.id}`)).json();assert.deepEqual(data.summary,{});
 console.log("STORY_ACCEPT real_auth_upload_R2_audiences_review_rings_views_GPS_proxy_block_delete_expiry=PASS");
}catch(error){console.log("STORY_ACCEPT FAILED check="+(typeof error?.message==="string"&&!/https|cookie|token|Authorization/i.test(error.message)?error.message.split("\n")[0].slice(0,130):"details_redacted"));process.exitCode=1;}
finally{
 const failures=[];async function attempt(label,action){try{await action();}catch{failures.push(label);}}
 await attempt("recover ambiguous users",async()=>{for(const user of result(await db.auth.admin.listUsers({page:1,perPage:1000}),"users").users)if(user.user_metadata?.intimo_stories_acceptance_run===run&&!members.some(m=>m.id===user.id))members.push({id:user.id});});
 const ids=members.map(m=>m.id);
 if(ids.length){
  await attempt("recover all fixture storage",async()=>{for(const row of result(await db.from("media_objects").select("id,object_key,variants").in("owner_id",ids),"media")){if(!mediaIds.includes(row.id))mediaIds.push(row.id);keys.add(row.object_key);for(const key of Object.values(row.variants||{}))keys.add(key);}});
  for(const key of keys)await attempt("delete/verify object",async()=>{await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));try{await s3.send(new HeadObjectCommand({Bucket:bucket,Key:key}));throw Error("Object remains");}catch(e){if(e.$metadata?.httpStatusCode!==404)throw e;}});
  for(const [table,column]of [["story_views","viewer_id"],["member_stories","owner_id"],["media_objects","owner_id"],["notifications","user_id"]])await attempt(table,async()=>result(await db.from(table).delete().in(column,ids),table));
  for(const col of ["actor_profile_id","actor_user_id","resource_id"])await attempt("audit",async()=>result(await db.from("audit_events").delete().in(col,[...ids,...mediaIds,...storyIds]),"audit"));
  await attempt("rate buckets",async()=>result(await db.from("rate_limit_buckets").delete().in("key",ids.flatMap(id=>["profile-create:","profile-update:","notifications-preferences:","story-publish:","stories-read:","story-image:","media-presign:","media-complete:","media-view:","block:"].map(prefix=>prefix+id))),"rates"));
  await attempt("profiles",async()=>result(await db.from("profiles").delete().in("id",ids),"profiles"));
  for(const m of members)await attempt("Auth cleanup",async()=>{const response=await db.auth.admin.deleteUser(m.id);if(response.error?.status!==404)result(response,"Auth");});
  for(const [table,column]of [["profiles","id"],["member_stories","owner_id"],["story_views","viewer_id"],["media_objects","owner_id"],["notifications","user_id"],["unread_email_outbox","profile_id"],["email_send_state","profile_id"]])await attempt("verify "+table,async()=>{const r=await db.from(table).select("*",{head:true,count:"exact"}).in(column,ids);result(r,"absence");assert.equal(r.count,0);});
  for(const m of members)await attempt("verify Auth absence",async()=>assert.equal((await db.auth.admin.getUserById(m.id)).error?.status,404));
 }
 if(baseline)await attempt("preserve existing profiles/media/story data",async()=>assert.deepEqual(await fingerprint(),baseline));
 for(const client of clients)await client.dispose();
 console.log(`STORY_ACCEPT cleanup=${failures.length?"FAILED":"PASS"} accounts=${ids.length} storedKeys=${keys.size} failures=${failures.join(",")||"none"}`);
 if(failures.length)process.exitCode=1;
}
