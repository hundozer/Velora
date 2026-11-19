import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULT_GROUND,POLICY_GROUNDS} from "../src/lib/moderation/outcomes.mjs";
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
test("screenshot report reason reaches all moderation layers",()=>{
 const sql=read("supabase/migrations/20261119160000_nonconsensual_screenshot_reports.sql");
 assert.match(sql,/ROLLBACK/);
 assert.match(sql,/NON_CONSENSUAL_SCREENSHOT/);
 assert.match(sql,/SCREENSHOT_CONSENT/);
 assert.match(read("src/app/api/reports/route.ts"),/NON_CONSENSUAL_SCREENSHOT/);
 assert.equal(DEFAULT_GROUND.NON_CONSENSUAL_SCREENSHOT,"SCREENSHOT_CONSENT");
 assert.match(POLICY_GROUNDS.SCREENSHOT_CONSENT,/screenshot|recording/i);
 assert.match(read("src/components/safety/ReportModal.tsx"),/value="NON_CONSENSUAL_SCREENSHOT"/);
});
test("member guideline and Czech translations describe consent before sharing",()=>{
 const legal=read("src/app/legal/[slug]/page.tsx");
 const cs=JSON.parse(read("src/locales/cs/phrases.json"));
 assert.match(legal,/Never share a screenshot/);
 assert.ok(cs["Screenshots and recordings"]);
 assert.ok(cs["Shared screenshot or recording without consent"]);
});
test("message bodies deter selection and copy, without false screenshot claims",()=>{
 const chat=read("src/components/chat/ChatWindow.tsx");
 assert.match(chat,/select-none" onCopy=\{\(event\)/);
 assert.match(chat,/event\.preventDefault\(\)/);
 assert.match(read("docs/REPORTS_AND_APPEALS.md"),/native app/);
});
