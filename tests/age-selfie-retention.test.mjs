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

test("age evidence policy retains decision but deletes stored bytes and variants",()=>{
 const retention=read("src/lib/privacy/retention.ts");
 assert.match(retention,/review\.status==="VERIFIED"/);
 assert.match(retention,/\["FAILED","RETRY_REQUESTED"\]/);
 assert.match(retention,/Date\.parse\(review\.reviewed_at\)<=Date\.now\(\)-30\*86400000/);
 assert.match(retention,/deleteStoredObject\(key\)/);
 assert.match(retention,/deleteVariantObjects\(String\(media\.id\)\)/);
 assert.match(retention,/provider_reference:null/);
 assert.match(retention,/from\("media_objects"\)\.delete\(\)/);
 assert.doesNotMatch(retention,/from\("verification_reviews"\)\.delete\(\)/);
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
  "Only our review team sees this photo. We delete it when approved, or 30 days after a refusal or retry request.",
  "We check every person to make sure everyone here is an adult. It takes a minute, and only our team sees your selfie. Until we approve it, your profile stays private."
 ];
 for(const phrase of phrases){assert.ok(cs[phrase]);assert.ok(page.includes(phrase)||gate.includes(phrase));}
});
