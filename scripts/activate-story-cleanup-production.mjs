// Explicit post-merge operation only, never called by the normal build.
import assert from "node:assert/strict";
import {createHmac,randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
assert.equal(process.env.VERCEL_ENV,"production");
assert.equal(process.env.VERCEL_PROJECT_ID,"prj_hZBTijIxLYZCQr2ePituCyOqk7og");
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,"bkdyjdbmtucqvgebqadp.supabase.co");
assert.match(process.env.INTIMO_APPROVED_STORIES_COMMIT||"",/^[0-9a-f]{40}$/);
assert.equal(process.env.VERCEL_GIT_COMMIT_SHA,process.env.INTIMO_APPROVED_STORIES_COMMIT,"Only the reviewed merged application can activate this worker");
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY,"Missing production capability");
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const run=randomUUID();
const bearer=createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update("intimo-story-cleanup-v1").digest("hex");
const {error}=await db.rpc("intimo_configure_story_cleanup",{p_url:"https://intimo.live/api/internal/stories/cleanup",p_bearer:bearer,p_run:run,p_protection:null,p_expires_at:null});
if(error)throw Error("Story cleanup activation failed: "+(error.code||"RPC failure"));
console.log("STORY_CLEANUP production_configured run="+run+" schedule=hourly-minute-7");
