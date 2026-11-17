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

**Fix.** Production gets its own private bucket and key. Done in the dashboards, about 15 minutes:

1. ✅ **Cloudflare → R2 → Create bucket** `intimo-media`, with public access disabled and no
   custom domain (created 17 November).
2. **Cloudflare → R2 → Manage API tokens → Create token**: *Object Read & Write*, restricted to
   **only** `intimo-media`. Keep the Access Key ID and Secret.
3. **Copy the existing files** before switching, so current photos keep working. The script only
   reads the source and writes the target, never deletes, skips files already copied, and checks
   every file afterwards. Use the old (preview) key for the source and the new key for the target:

   ```bash
   R2_ACCOUNT_ID=<account id>    R2_SOURCE_BUCKET=intimo-staging-media R2_SOURCE_KEY_ID=<old key id> R2_SOURCE_SECRET=<old secret>    R2_TARGET_BUCKET=intimo-media R2_TARGET_KEY_ID=<new key id> R2_TARGET_SECRET=<new secret>    node scripts/copy-r2-bucket.mjs
   ```

   That is a dry run that lists what it would copy. Run it again with `--copy` at the end to
   copy. It prints `"verified":true` when every file arrived intact.
4. **Vercel → Settings → Environment Variables, Production only.** Edit these three and leave
   the Preview ones alone:
   `CLOUDFLARE_R2_BUCKET_NAME` = `intimo-media`, plus `CLOUDFLARE_R2_ACCESS_KEY_ID` and
   `CLOUDFLARE_R2_SECRET_ACCESS_KEY` = the new key.
5. **Redeploy production** (Deployments → latest → Redeploy). Check that an existing member photo
   still loads and that a new upload works.
6. **Limit the preview key** to `intimo-staging-media` only (Cloudflare → R2 → API tokens → edit),
   so a test site can never touch production photos again. If the old key was account-wide, it is
   simpler to create a new staging-only key and update the three Preview variables the same way.

The staging bucket keeps its copies of production photos after the move. Once production is
confirmed working, those can be removed from staging (an irreversible step, so owner's call).

Checklist for both buckets (Cloudflare → bucket → Settings): **Public Development URL
(r2.dev): Disabled**, and **Custom Domains: empty**.
