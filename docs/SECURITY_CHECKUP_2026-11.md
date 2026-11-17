# Security check-up (FM-03), 16 November 2026

Scope from the Founding Member feedback: photo metadata, private-album access, how stored
files can be reached, and personal data we collect but do not need. Each finding names the
test that now guards it.

## Results

| Area | Before | Now | Guard |
|---|---|---|---|
| **Location and camera data in photos** | Already stripped: every image is re-encoded to WebP at the delivery boundary (`src/lib/media/delivery.ts`), and resized variants are built the same way. | Unchanged, now proved end to end with a phone photo carrying GPS, camera make and model: no EXIF, XMP or ICC data leaves the server. | `tests/media-privacy-checkup.test.mjs` |
| **Videos** | Already remuxed at upload with every metadata stream dropped (`sanitizeVideo.mjs`). The media route only serves the sanitized copy. | Unchanged. | `tests/media-delivery.test.mjs` |
| **Taking album access back** | Already checked on every request, with bytes proxied (`private, no-store`) and no storage link handed out. | Proved: a revoked grant, or a 24-hour grant that has run out, gets *not found* on the very next request, and nothing is read from storage. | `tests/media-privacy-checkup.test.mjs` |
| **Admin view of verification selfies** | **Fixed.** The admin route redirected to a five-minute signed storage link to the *original* selfie, so the link was reusable and the photo still carried its metadata. | Bytes are proxied and re-encoded like every other photo. Viewing is still audited first. | `tests/media-privacy-checkup.test.mjs`, `tests/security-boundaries.test.mjs` |
| **Profile photo links at sign-up** | **Fixed.** Profile creation accepted any `https://` address as the photo. A crafted request could point it at someone else's server and learn the IP address of everyone who viewed the profile. | Creation stores no photo. Photos are added afterwards through the existing route, which accepts only the member's own uploaded media. | `tests/media-privacy-checkup.test.mjs` |
| **Ways to read stored files** | One unused helper built cacheable signed links (`getCacheableDownloadUrl`), and the upload helper still built a public bucket address nobody used. | Both removed. A test now fails if any new code reads storage or signs a download link outside the delivery boundary and the upload pipeline. | `tests/media-privacy-checkup.test.mjs` |
| **Intimate fields nothing uses** | **Stopped collecting.** Profile creation still accepted `pubic_hair_grooming`, `piercing`, `tattoo` and `favourite_sex_positions` from the request, and copied hobbies into `sex_hobbies`. Nothing displays them, and onboarding doesn't send them. | New profiles always store them empty. Existing values are untouched: see the decision below. | `tests/media-privacy-checkup.test.mjs` |

What revocation cannot do: a photo someone has already seen may have been screenshotted.
Revoking stops every *future* load. Browsers are told not to cache private media.

## Decision needed: existing values in unused intimate fields

These columns are shown nowhere in the product, are excluded from discovery, and are wiped on
account deletion. Desires and boundaries now cover the same ground, with consent.

`erogenous_zones`, `favourite_sex_places`, `favourite_sex_positions`, `sex_hobbies`,
`pubic_hair_grooming`, `piercing`, `tattoo`

To see whether production holds any values, run this read-only query in the Supabase SQL editor:

```sql
select
  count(*) filter (where erogenous_zones         is not null and erogenous_zones         <> '[]'::jsonb) as erogenous_zones,
  count(*) filter (where favourite_sex_places    is not null and favourite_sex_places    <> '[]'::jsonb) as favourite_sex_places,
  count(*) filter (where favourite_sex_positions is not null and favourite_sex_positions <> '[]'::jsonb) as favourite_sex_positions,
  count(*) filter (where sex_hobbies             is not null and sex_hobbies             <> '[]'::jsonb) as sex_hobbies,
  count(*) filter (where pubic_hair_grooming is not null) as pubic_hair_grooming,
  count(*) filter (where piercing            is not null) as piercing,
  count(*) filter (where tattoo              is not null) as tattoo
from public.profiles;
```

Recommendation: if the counts are zero or tiny, clear the values in one reviewed migration, then
drop the columns in a later release once nothing references them. Clearing data is irreversible,
so it needs the owner's explicit approval (AGENTS.md: no destroying production data without it).

Lower priority, not personal data: legacy monetisation columns (`monthly_subscription_price`,
`subscribers_count`, `member_tier`, `followers_count`, `total_content_count`) can go with the
P0 cleanup.

## Storage buckets: separate production from staging

**Finding (17 November 2026).** Cloudflare had a single bucket, `intimo-staging-media`, with
public access disabled. Previews are configured to use it. The production bucket setting in
Vercel is stored as *sensitive*, so its value can no longer be read, but with only one bucket in
the account it can only have been that one. The live site and the test sites therefore shared
storage, and the preview keys could read and delete real members' photos (previews are behind
Vercel login, and the bucket held 7.7 MB). Vercel has no `CLOUDFLARE_R2_PUBLIC_DOMAIN`, so the
code never pointed members at a public bucket address.

**Fix.** Production gets its own private bucket and key. Mostly done in the dashboards; about 45 minutes including a 20-minute wait:

1. ✅ **Cloudflare → R2 → Create bucket** `intimo-media`, with public access disabled and no
   custom domain (created 17 November).
2. **Cloudflare → R2 → Manage API tokens → Create Account API token** named `Intimo production`:
   *Object Read & Write*, restricted to **only** `intimo-media`. Keep the Access Key ID and Secret
   (the secret is shown once). For the copy, also create a temporary token
   `Intimo migration (delete after)` with *Object Read & Write* on **both** buckets. The existing
   tokens' secrets cannot be shown again.
3. **Allow browser uploads (CORS) on `intimo-media`.** Members' browsers upload directly to the
   bucket with a `PUT` and a `Content-Type` header, and a new bucket refuses that until CORS
   allows it. Without this, every upload breaks after the switch. In **intimo-media → Settings →
   CORS Policy → Add CORS policy**, paste the following (add any other domain the live site is
   served from):

   ```json
   [
     {
       "AllowedOrigins": ["https://intimo.live", "https://www.intimo.live"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Downloads need no CORS rule: members never read the bucket directly, because the server
   proxies every photo.
4. **Pick a quiet moment** (late evening). With the site behind Coming Soon and a handful of
   members, uploads are rare. An upload in the few minutes between the copy and the switch is
   caught up in step 7.
5. **Copy the existing files, from GitHub (no local setup).** The script only reads the source and
   writes the target, never deletes, skips files already copied, and checks every file afterwards.
   Its log shows counts only, never file names.
   1. **GitHub → Velora → Settings → Secrets and variables → Actions → New repository secret.**
      Add three secrets: `R2_ACCOUNT_ID` (Cloudflare → R2 → Overview, *Account ID*),
      `R2_MIGRATION_KEY_ID` and `R2_MIGRATION_SECRET` (the temporary migration key).
   2. **GitHub → Actions → "Copy R2 bucket (one-off)" → Run workflow** with mode `dry-run`. When it
      finishes, open the run: the last line reads like `{"total":42,"bytes":8063121,...}`.
   3. Run it again with mode `copy`. Success ends with `"verified":true`.

   The same script also runs locally (`node scripts/copy-r2-bucket.mjs`, with the `R2_*` variables
   from the workflow file set in the shell).
6. **Switch production, then redeploy.** In **Vercel → Settings → Environment Variables,
   Production only**, set `CLOUDFLARE_R2_BUCKET_NAME` = `intimo-media`, plus
   `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY` = the `Intimo production`
   key. Leave the Preview ones alone. Then Deployments → latest production → **Redeploy**.
7. **Wait 20 minutes, then run the workflow once more in `copy` mode.** Upload links stay valid for
   15 minutes, so anything uploaded through the old deployment has landed in the old bucket by
   then. The re-run copies only those stragglers and skips everything else. An upload that
   started before the switch and finished after it may show an error; the member just uploads
   again.
8. **Check the live site:** an existing member photo still loads, and a new photo upload works.
   This upload is the only real test of step 3. Then delete the temporary migration token in Cloudflare, and the three `R2_*` secrets in GitHub.
9. **Previews:** the three existing tokens are already limited to `intimo-staging-media`, so a
   test site cannot reach the production bucket. No change is needed. Delete
   `Intimo Local Development` if nobody runs the app on their own computer.

The staging bucket keeps its copies of production photos after the move. Once production is
confirmed working, those can be removed from staging (an irreversible step, so owner's call).

Checklist for both buckets (Cloudflare → bucket → Settings): **Public Development URL
(r2.dev): Disabled**, and **Custom Domains: empty**.
