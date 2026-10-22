/** One-off operator setup. Never included in default build or CI. */
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
assert.equal(process.env.VERCEL_ENV,"production");
assert.equal(process.env.VERCEL_GIT_COMMIT_SHA,"1917c10effb0dc41b4b8c2f303e4d81d6a5f541d");
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,"bkdyjdbmtucqvgebqadp.supabase.co");
assert.equal(process.env.INTIMO_UNREAD_EMAIL_ENABLED,"true");
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const bearer=createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update("intimo-unread-worker-v1").digest("base64url");
const {error}=await db.rpc("intimo_configure_unread_worker",{p_url:"https://intimo.live/api/internal/email/unread",p_bearer:bearer,p_protection:null,p_expires_at:null});
if(error) throw new Error("production_worker_configuration_failed:"+error.code);
console.log("UNREAD_ROLLOUT production_configured=true commit=1917c10effb0dc41b4b8c2f303e4d81d6a5f541d");
