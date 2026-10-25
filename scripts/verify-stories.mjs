// Actual page rehearsal with synthetic APIs. No accounts, files or DB records created remotely.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import {chromium,expect} from "@playwright/test";
import sharp from "sharp";
const out=await mkdtemp(tmpdir()+"/intimo-stories-");
const server=spawn("npm",["run","dev","--","--hostname","127.0.0.1","--port","3124"],{detached:true,stdio:["ignore","ignore","inherit"]});
const a="78100300-0000-4000-8000-000000000001",b="78100300-0000-4000-8000-000000000002",c="78100300-0000-4000-8000-000000000003",id="78100300-0000-4000-8000-000000000004";
const image=await sharp({create:{width:80,height:100,channels:3,background:"#5998ad"}}).png().toBuffer();
let browser;
try{
 let ready=false;for(let i=0;i<50;i++){try{if((await fetch("http://127.0.0.1:3124/stories")).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}assert.ok(ready);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();let viewed=false,unavailable=false;const writes=[];const uploads=[];
  const story={id,ownerId:b,mediaId:id,caption:"Synthetic story: a night in Prague",audience:"SELECTED",expiresAt:new Date(Date.now()+60000).toISOString(),viewed:false,url:`/api/stories/${id}/image`,owner:{display_name:"Synthetic B"}};
  await page.route("**/api/auth/session",r=>r.fulfill({json:{provisioned:true,accountState:"ACTIVE",actor:{id:a,email:"qa@example.invalid",role:"MEMBER",emailVerified:true}}}));
  await page.route("**/api/profile/me",r=>r.fulfill({json:{profile:{id:a,auth_id:a,email:"qa@example.invalid",display_name:"Synthetic A",account_status:"ACTIVE",age_verification_status:"AGE_DECLARED",date_of_birth:"1990-01-01",gender:"MALE",country:"CZ",city:"Prague"}}}));
  await page.route("**/api/access/age-declaration",r=>r.fulfill({json:{declared:true}}));
  await page.route("**/api/discovery/profiles**",r=>r.fulfill({json:{profiles:[{id:b,displayName:"Synthetic B"},{id:c,displayName:"Synthetic C"}],nextCursor:null}}));
  await page.route("**/api/discovery/introductions**",r=>r.fulfill({json:{introductions:[]}}));
  await page.route("**/api/desires/me",r=>r.fulfill({json:{desires:[]}}));
  await page.route("**/api/stories**",async r=>{
   const url=new URL(r.request().url());
   if(url.pathname.endsWith("/image"))return r.fulfill({contentType:"image/png",body:image});
   if(r.request().method()==="POST"){
    if(url.pathname==="/api/stories"){writes.push(r.request().postDataJSON());return r.fulfill({status:201,json:{id}});}
    viewed=true;return r.fulfill({json:{viewed:true}});
   }
   if(url.searchParams.get("summary")==="true")return r.fulfill({json:{summary:unavailable?{}:{[b]:{unread:!viewed,expiresAt:story.expiresAt}}}});
   if(url.searchParams.get("mine")==="true")return r.fulfill({json:{stories:[]}});
   return unavailable?r.fulfill({status:404,json:{error:"Stories unavailable"}}):r.fulfill({json:{stories:[story]}});
  });
  await page.route("**/api/media/presign-upload",r=>{uploads.push(r.request().postDataJSON());return r.fulfill({json:{mediaId:id,uploadUrl:"http://127.0.0.1:3124/synthetic-upload"}});});
  await page.route("**/synthetic-upload",r=>r.fulfill({status:200,body:""}));
  await page.route("**/api/media/*/complete",r=>r.fulfill({json:{success:true}}));
  await page.goto("http://127.0.0.1:3124/people?view=everyone");
  const age=page.getByRole("button",{name:"Yes, I'm 18+"});if(await age.isVisible())await age.click();
  await page.getByRole("button",{name:"Synthetic B: new stories",exact:true}).waitFor();
  await expect(page.getByRole("button",{name:"Open Synthetic C's profile",exact:true})).toHaveAttribute("data-story-state","none");
  assert.equal(await page.locator("body").evaluate(e=>e.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/rings-${width}.png`,fullPage:true});
  await page.getByRole("button",{name:"Synthetic B: new stories",exact:true}).click();
  await page.getByText(story.caption,{exact:true}).waitFor();await expect(page.getByRole("button",{name:"Report photo"})).toBeEnabled();
  assert.equal(viewed,true);
  await page.getByRole("button",{name:"Close stories"}).click();
  await page.getByRole("button",{name:"Synthetic B: viewed stories",exact:true}).waitFor();
  await page.goto("http://127.0.0.1:3124/stories/new");
  await expect(page.getByLabel("Who can see this?")).toHaveValue("FRIENDS");
  await page.getByLabel("Photo",{exact:true}).setInputFiles({name:"synthetic.png",mimeType:"image/png",buffer:image});
  await page.getByLabel("A few words",{exact:false}).fill("Synthetic invitation");
  await page.getByLabel("Who can see this?").selectOption("MEMBERS");
  const submit=page.getByRole("button",{name:"Publish story",exact:true});
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox",{name:/This is a non-explicit photo/}).check();
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/compose-${width}.png`,fullPage:true});
  await submit.click();await page.waitForURL("**/stories");
  assert.equal(writes.length,1);assert.equal(writes[0].confirmPublish,true);assert.equal(writes[0].audience,"MEMBERS");
  assert.equal(uploads[0].category,"STORY");assert.equal(uploads[0].visibility,"PRIVATE");assert.equal(uploads[0].participantDeclaration.containsOtherIdentifiableParticipants,false);
  unavailable=true;await page.goto(`http://127.0.0.1:3124/stories/${b}`);
  await page.getByRole("status").filter({hasText:"Stories unavailable"}).waitFor();
  assert.equal(await page.locator('img[src*="/api/stories/"]').count(),0);
  console.log(`PASS ${width}: unread/viewed/absent aura, separate profile link, viewer, consent, upload payload and unavailable denial`);
  await context.close();
 }
 console.log("Screenshots: "+out);
}finally{await browser?.close();try{process.kill(-server.pid,"SIGTERM");}catch{}}
