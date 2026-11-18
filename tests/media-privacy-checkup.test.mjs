// FM-03 security check-up: photo metadata, album revocation and storage access paths.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import sharp from "sharp";
import { sanitizeDeliveredImage } from "../src/lib/media/variants.mjs";
import { grantIsActive } from "../src/lib/privateAccess.mjs";
import * as ageCheck from "../src/lib/auth/ageCheck.mjs";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
function load(file, mocks) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => (name in mocks ? mocks[name] : require(name)), module, module.exports);
  return module.exports;
}
/** Supabase stand-in: every query resolves to whatever `answer(table, columns)` returns. */
function fakeDb(answer) {
  return { from(table) {
    let columns = "";
    const q = new Proxy({}, { get(_, key) {
      if (key === "select") return (value) => { columns = value; return q; };
      if (key === "then") return (resolve) => resolve(answer(table, columns));
      return () => q;
    } });
    return q;
  } };
}
const gpsPhoto = () => sharp({ create: { width: 24, height: 16, channels: 3, background: "teal" } })
  .withExif({ IFD0: { Make: "Private camera", Model: "Phone 12" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "50/1 5/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "14/1 25/1 0/1" } })
  .jpeg().toBuffer();
const MEDIA = "12345678-1234-4123-8123-123456789012";
const OWNER = "22345678-1234-4123-8123-123456789012";
const VIEWER = "32345678-1234-4123-8123-123456789012";

test("a phone photo with GPS leaves the delivery boundary with no EXIF at all", async () => {
  const original = await gpsPhoto();
  assert.ok((await sharp(original).metadata()).exif, "fixture carries EXIF + GPS");
  const { deliverMedia } = load("src/lib/media/delivery.ts", { "@/lib/storage/r2": { getStoredObject: async () => original }, "./variants.mjs": { sanitizeDeliveredImage } });
  const response = await deliverMedia("photos/original.jpg", "image/jpeg");
  const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.exif, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(meta.icc, undefined);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("only the delivery boundary and the upload pipeline read stored files", () => {
  // A new route that reads storage directly could serve an original with GPS, or hand out
  // a reusable storage URL. Add it here only if it re-encodes like src/lib/media/delivery.ts.
  const allowed = new Set(["src/lib/storage/r2.ts", "src/lib/media/delivery.ts", "src/app/api/media/[id]/complete/route.ts"]);
  const offenders = [];
  const walk = (dir) => { for (const name of readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, name);
    if (statSync(path.join(root, rel)).isDirectory()) walk(rel);
    else if (/\.(ts|tsx|mjs)$/.test(name) && !allowed.has(rel) && /\b(getStoredObject|getStoredObjectStream|getPresignedDownloadUrl|getSignedUrl|GetObjectCommand)\b/.test(read(rel))) offenders.push(rel);
  } };
  walk("src");
  assert.deepEqual(offenders, []);
  const r2 = read("src/lib/storage/r2.ts");
  assert.doesNotMatch(r2, /getCacheableDownloadUrl/);
  // No public bucket address is ever built; the bucket must stay private.
  assert.doesNotMatch(r2, /r2\.dev|PUBLIC_DOMAIN|publicUrl/);
});

function mediaRoute({ grant, deliver }) {
  const db = fakeDb((table, columns) => {
    if (table === "media_objects") return { data: columns === "variants" ? { variants: null } : { id: MEDIA, owner_id: OWNER, category: null, object_key: "photos/private.jpg", mime_type: "image/jpeg", upload_status: "AVAILABLE", visibility: "PRIVATE", moderation_status: "APPROVED", processing_status: "READY" }, error: null };
    if (table === "album_access_grants") return { data: grant(), error: null };
    if (table === "media_album_items") return { data: [], error: null };
    if (table === "user_blocks") return { data: null, error: null };
    if (table === "profiles") return { data: { account_status: "ACTIVE", age_verification_status: "AGE_VERIFIED", discovery_disabled: false }, error: null };
    return { data: null, error: null };
  });
  return load("src/app/api/media/[id]/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: VIEWER, userId: VIEWER } }), hasAdultAccess: () => true },
    "@/lib/auth/ageCheck.mjs": ageCheck,
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/storage/r2": {}, "@/lib/auth/durableAudit": {},
    "@/lib/media/variants.mjs": { parseRequestedWidth: () => null, pickVariantWidth: () => null },
    "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/privateAccess.mjs": { grantIsActive },
    "@/lib/media/delivery": { deliverMedia: deliver },
  });
}

test("revoking album access stops the very next photo request", async () => {
  let grant = { status: "GRANTED", grant_type: "UNTIL_REVOKED", expires_at: null };
  let reads = 0;
  const api = mediaRoute({ grant: () => grant, deliver: async () => { reads++; return new Response("pixels", { headers: { "Cache-Control": "private, no-store" } }); } });
  const get = () => api.GET({ nextUrl: new URL(`https://example.test/api/media/${MEDIA}`), headers: new Headers() }, { params: { id: MEDIA } });

  const before = await get();
  assert.equal(before.status, 200);
  assert.equal(before.headers.get("Location"), null, "bytes are proxied; no reusable storage link");
  assert.equal(reads, 1);

  grant = { ...grant, status: "REVOKED" };
  assert.equal((await get()).status, 404);
  // A 24-hour grant that has run out behaves the same, without anyone touching it.
  grant = { status: "GRANTED", grant_type: "ONCE", expires_at: new Date(Date.now() - 1000).toISOString() };
  assert.equal((await get()).status, 404);
  assert.equal(reads, 1, "nothing is read from storage after access ends");
});

test("admin verification evidence is re-encoded bytes, never a storage redirect", async () => {
  const original = await gpsPhoto();
  const { deliverMedia } = load("src/lib/media/delivery.ts", { "@/lib/storage/r2": { getStoredObject: async () => original }, "./variants.mjs": { sanitizeDeliveredImage } });
  const db = fakeDb((table) => table === "verification_reviews"
    ? { data: { id: MEDIA, profile_id: OWNER, provider_reference: MEDIA }, error: null }
    : { data: { id: MEDIA, owner_id: OWNER, object_key: "verification/selfie.jpg", mime_type: "image/jpeg", visibility: "PRIVATE", upload_status: "AVAILABLE" }, error: null });
  const audits = [];
  const route = load("src/app/api/admin/verification/[id]/evidence/route.ts", {
    "@/lib/auth/adminApi": { requireAdminPermission: async () => ({ actor: { userId: "admin", profileId: "admin", role: "SUPER_ADMIN" } }) },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/media/delivery": { deliverMedia },
    "@/lib/auth/auditLogger": { auditLogger: { logEvent: () => {} } },
    "@/lib/auth/durableAudit": { appendDurableAudit: async (_db, entry) => { audits.push(entry.action); return true; } },
  });
  const response = await route.GET({}, { params: { id: MEDIA } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Location"), null);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).exif, undefined);
  assert.deepEqual(audits, ["VERIFICATION_EVIDENCE_VIEW"], "viewing is audited before the bytes go out");
});

test("profile creation no longer collects unused intimate fields or third-party avatar links", () => {
  const route = read("src/app/api/profile/me/route.ts");
  const post = route.slice(route.indexOf("export async function POST"), route.indexOf("export async function PUT"));
  for (const field of ["pubic_hair_grooming: null", "piercing: null", "tattoo: null", "favourite_sex_positions: []", "sex_hobbies: []", "avatar_url: null"]) assert.ok(post.includes(field), field);
  assert.doesNotMatch(post, /body\.(pubicHairGrooming|piercing|tattoo|positions|avatarUrl)/);
  // Later photo changes go through PUT, which only accepts the member's own uploaded media.
  assert.match(route, /PROFILE_MEDIA_REFERENCE = \/\^\\\/api\\\/media\\\//);
});
