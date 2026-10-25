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
  const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();let viewed=false,unavailable=false;let mine=true;const writes=[];const uploads=[];
  const story={id,ownerId:b,mediaId:id,caption:"Synthetic story: a night in Prague",audience:"SELECTED",expiresAt:new Date(Date.now()+60000).toISOString(),viewed:false,url:`/api/stories/${id}/image`,owner:{display_name:"Synthetic B"}};
  await page.route("**/api/auth/session",r=>r.fulfill({json:{provisioned:true,accountState:"ACTIVE",actor:{id:a,email:"qa@example.invalid",role:"MEMBER",emailVerified:true}}}));
  await page.route("**/api/profile/me",r=>r.fulfill({json:{profile:{id:a,auth_id:a,email:"qa@example.invalid",display_name:"Synthetic A",account_status:"ACTIVE",age_verification_status:"AGE_DECLARED",date_of_birth:"1990-01-01",gender:"MALE",country:"CZ",city:"Prague"}}}));
  await page.route("**/api/access/age-declaration",r=>r.fulfill({json:{declared:true}}));
  const plan={id,authorId:a,authorName:"Synthetic A",title:"A table for three",text:"Cocktails, flirting, and see where the evening takes us.",startsAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),live:true,isMine:true,canReply:false,areaName:"Vinohrady",eligibilityText:"Your invitation."};
  await page.route("**/api/dating-ads**",r=>r.fulfill({json:{plans:unavailable?[]:[{...plan,isMine:mine,canReply:!mine}]}}));
  await page.goto(`http://127.0.0.1:3124/tonight/invitation/${id}`);
  const age=page.getByRole("button",{name:"Yes, I'm 18+"});if(await age.isVisible())await age.click();
  await page.getByRole("heading",{name:plan.title,exact:true}).waitFor();
  await expect(page.getByRole("link",{name:"Share to your Story",exact:true})).toHaveAttribute("href",`/stories/new?plan=${id}`);
  await expect(page.getByRole("button",{name:"End it now"})).toBeVisible();
  assert.equal(await page.locator("body").evaluate(e=>e.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/invitation-${width}.png`,fullPage:true});
  await page.getByRole("link",{name:"Share to your Story",exact:true}).click();
  await page.getByText("Invitation attached",{exact:true}).waitFor();
  await expect(page.getByRole("textbox",{name:/A few words/})).toHaveValue(plan.title);
  await expect(page.getByRole("combobox",{name:/Who can see this/})).toHaveValue("FRIENDS");
  await expect(page.getByRole("button",{name:"Publish story",exact:true})).toBeDisabled();
  mine=false;await page.goto(`http://127.0.0.1:3124/tonight/invitation/${id}`);
  await expect(page.getByRole("link",{name:"Reply to Synthetic A",exact:true})).toHaveAttribute("href",`/messages?user=${a}&datingAd=${id}`);
  await expect(page.getByRole("button",{name:"Report this plan"})).toBeVisible();
  unavailable=true;await page.reload();await page.getByRole("heading",{name:"This invitation is unavailable.",exact:true}).waitFor();
  await expect(page.getByRole("link",{name:"Reply to Synthetic A",exact:true})).toHaveCount(0);
  await context.close();
 }
 console.log("PASS mobile/desktop: owner controls, photo share draft, friends default, acknowledgement, private pitch link, report and unavailable denial; screenshots "+out);
}finally{await browser?.close();try{process.kill(-server.pid,"SIGTERM");}catch{}}
