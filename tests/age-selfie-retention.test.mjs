import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("approved evidence is deleted on the decision path, not deferred",()=>{
 const admin=read("src/app/api/admin/verification/route.ts");
 assert.match(admin,/status === "VERIFIED"/);
 assert.match(admin,/await eraseAgeReviewSelfie\(db, id\)/);
 assert.match(admin,/Retry this decision to finish deletion/);
});

test("age evidence erasure is safely scoped, hold-aware and retryable",()=>{
 const retention=read("src/lib/privacy/retention.ts");
 assert.match(retention,/review.status === "VERIFIED"/);
 assert.match(retention,/\["FAILED", "RETRY_REQUESTED"\]/);
 assert.match(retention,/Date.parse\(review.reviewed_at\) <= Date.now\(\) - 30 \* 86400000/);
 assert.match(retention,/from\("retention_holds"\)/);
 assert.match(retention,/if \(holdError \|\| hold\) return false/);
 assert.match(retention,/media.owner_id !== review.profile_id/);
 assert.match(retention,/media.category !== "AGE_CHECK"/);
 assert.match(retention,/media.visibility !== "PRIVATE"/);
 assert.match(retention,/deleteStoredObject\(key\)/);
 assert.match(retention,/deleteVariantObjects\(String\(media.id\)\)/);
 assert.match(retention,/from\("media_objects"\).delete\(\)/);
 assert.match(retention,/provider_reference: null/);
 assert.doesNotMatch(retention,/from\("verification_reviews"\).delete\(\)/);
 const metadataDelete=retention.indexOf('from("media_objects").delete()');
 const unlink=retention.indexOf('update({ provider_reference: null })');
 assert.ok(metadataDelete>0 && unlink>metadataDelete,"keep the reference when media metadata deletion fails");
});

test("manual age approval erases evidence and the cron retries missed approvals",()=>{
 const admin=read("src/app/api/admin/users/[id]/route.ts");
 const retention=read("src/lib/privacy/retention.ts");
 assert.match(admin,/await eraseAgeReviewSelfie\(db, reviewId\)/);
 assert.match(admin,/The retention worker will retry it/);
 assert.match(retention,/eq\("status", "VERIFIED"\).not\("provider_reference", "is", null\)/);
 assert.match(retention,/Promise.all\(\[/);
 assert.match(retention,/if \(approved.error \|\| refused.error\)/);
});

test("age evidence retention cron is authenticated and scheduled daily",()=>{
 const route=read("src/app/api/cron/age-selfie-retention/route.ts");
 const vercel=JSON.parse(read("vercel.json"));
 assert.match(route,/process\.env\.CRON_SECRET/);
 assert.match(route,/Bearer/);
 assert.match(route,/eraseExpiredAgeReviewSelfies\(db\)/);
 assert.ok(vercel.crons.some(x=>x.path==="/api/cron/age-selfie-retention" && x.schedule==="0 3 * * *"));
});

test("member-facing age explanation is translated in both languages",()=>{
 const page=read("src/app/verify-age/page.tsx"),gate=read("src/components/auth/AgeCheckGate.tsx");
 const cs=JSON.parse(read("src/locales/cs/phrases.json"));
 const phrases=[
  "We check everyone to make sure we are all adults here. It takes a minute, and only our team sees your selfie.",
  "Only our review team sees this photo. We normally delete it after approval, or 30 days after a refusal or retry request. A legal hold may require longer retention.",
  "We check every person to make sure everyone here is an adult. It takes a minute, and only our team sees your selfie. Until we approve it, your profile stays private."
 ];
 for(const phrase of phrases){assert.ok(cs[phrase]);assert.ok(page.includes(phrase)||gate.includes(phrase));}
});
