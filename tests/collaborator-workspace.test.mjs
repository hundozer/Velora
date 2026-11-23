import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("cofounder workspace uses server-side revocable grants, never founding member role",async()=>{
 const api=await read("src/app/api/collaborator/workspace/route.ts");
 const sql=await read("supabase/migrations/20261123220000_collaborator_workspaces.sql");
 assert.match(api,/resolveServerActor/);
 assert.match(api,/hasAdultAccess/);
 assert.match(api,/collaborator_workspaces/);
 assert.match(api,/BETA_COMMUNITY/);
 assert.doesNotMatch(api,/membership_level/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.collaborator_workspaces FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(sql,/d54ebb65/); // account assignment is not hardcoded into repository
});
test("collaborator metrics are limited to her own invitations and anonymous aggregate survey",async()=>{
 const api=await read("src/app/api/collaborator/workspace/route.ts");
 assert.match(api,/owner_profile_id",identity\.actor\.profileId/);
 assert.match(api,/answers\.length>=5/);
 assert.doesNotMatch(api,/beta_feedback_contacts/);
 assert.doesNotMatch(api,/direct_messages|profile_email|select\("email/);
 assert.match(api,/allowed:\s*false/);
});
test("workspace menu appears in both desktop and mobile account menus",async()=>{
 const navbar=await read("src/components/layout/Navbar.tsx");
 const me=await read("src/app/me/page.tsx");
 const menu=await read("src/components/community/CollaboratorWorkspaceMenuLink.tsx");
 assert.match(navbar,/<CollaboratorWorkspaceMenuLink/);
 assert.match(me,/<CollaboratorWorkspaceMenuLink mobile/);
 assert.match(menu,/\/api\/collaborator\/workspace/);
 assert.match(menu,/if\(!allowed\)return null/);
 const cs=JSON.parse(await read("src/locales/cs/phrases.json"));
 assert.ok(cs["Community workspace"]);
 assert.ok(cs["Your Intimo workspace"]);
});
