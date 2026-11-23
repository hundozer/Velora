import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const get=(p)=>readFile(new URL("../"+p,import.meta.url),"utf8");

test("Carolinka's 14 anonymous answers and separate question 15 opt-in are present",async()=>{
 const definitions=await get("src/lib/betaFeedback.ts");
 assert.equal((definitions.match(/\{id:(?:[1-9]|1[0-4]),en:/g)||[]).length,14);
 assert.match(definitions,/id:3[^\n]*kind:"scale"/);
 assert.match(definitions,/id:9[^\n]*kind:"choice"/);
 assert.match(definitions,/id:12[^\n]*kind:"scale"/);
 assert.match(definitions,/\["en","cs"\]|language IN \('en','cs'\)/);
 const page=await get("src/app/beta-feedback/page.tsx");
 assert.match(page,/15-minute follow-up conversation/);
 assert.match(page,/beta-feedback\/contact/);
 assert.match(page,/BETA_FEEDBACK_OPEN_AT/);
 assert.match(page,/BETA_FEEDBACK_CLOSE_AT/);
});
test("no account id or exact timestamp is stored with submitted responses",async()=>{
 const sql=await get("supabase/migrations/20261123210000_native_beta_feedback.sql");
 const table=sql.split("CREATE TABLE IF NOT EXISTS public.beta_feedback_responses")[1].split(");")[0];
 assert.doesNotMatch(table,/profile_id|auth_id|email|ip_address|user_agent|submitted_at/i);
 assert.match(table,/submitted_on date/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/g);
 assert.match(sql,/REVOKE ALL ON public.beta_feedback_responses,public.beta_feedback_contacts FROM PUBLIC,anon,authenticated/);
 const endpoint=await get("src/app/api/beta-feedback/route.ts");
 assert.match(endpoint,/hasAdultAccess/);
 assert.match(endpoint,/validateBetaFeedback/);
 assert.doesNotMatch(endpoint,/insert\(\{[^}]*userId/);
 const contacts=await get("src/app/api/beta-feedback/contact/route.ts");
 assert.doesNotMatch(contacts,/beta_feedback_responses/);
});
test("private dashboard and admin only reporting include review, CSV and Czech copy",async()=>{
 const admin=await get("src/app/api/admin/beta-feedback/route.ts");
 assert.match(admin,/requireAdminPermission\(req,"users:view_sensitive"\)/);
 assert.match(admin,/format"\)==="csv"/);
 assert.match(admin,/spreadsheet formula/);
 const adminUi=await get("src/components/admin/AdminCommandCenter.tsx");
 const shell=await get("src/components/admin/AdminWorkspaceShell.tsx");
 assert.match(adminUi,/AdminBetaFeedbackConsole/);
 assert.match(shell,/\/admin\/beta-feedback/);
 const translations=JSON.parse(await get("src/locales/cs/phrases.json"));
 for(const key of ["Help shape Intimo","In three words, how did Intimo feel?","What kind of person should be here who isn't yet? No names.","Send feedback"])
 assert.ok(translations[key],`Missing Czech beta translation: ${key}`);
});
