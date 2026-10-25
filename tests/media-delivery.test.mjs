import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import sharp from "sharp";
import { sanitizeDeliveredImage } from "../src/lib/media/variants.mjs";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const id = "12345678-1234-4123-8123-123456789012";
const ownerId = "22345678-1234-4123-8123-123456789012";

function route({ ownerStatus = "ACTIVE", blockError = null, category = null, deliver = async () => new Response("pixels") } = {}) {
  const db = { from(table) {
    let columns = "";
    const q = new Proxy({}, { get(_, key) {
      if (key === "select") return (value) => { columns = value; return q; };
      if (key === "then") return (resolve) => resolve(table === "media_objects"
        ? { data: columns === "variants" ? { variants: null } : { id, owner_id: ownerId, category, object_key: "photos/raw.jpg", mime_type: "image/jpeg", upload_status: "AVAILABLE", visibility: "MEMBERS_ONLY", moderation_status: "APPROVED", processing_status: "READY" }, error: null }
        : table === "user_blocks" ? { data: null, error: blockError }
        : { data: { account_status: ownerStatus, discovery_disabled: false }, error: null });
      return () => q;
    }});
    return q;
  }};
  return load("src/app/api/media/[id]/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: "viewer", userId: "viewer" } }), hasAdultAccess: () => true },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/storage/r2": {},
    "@/lib/media/variants.mjs": { parseRequestedWidth: () => null },
    "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/auth/durableAudit": {}, "@/lib/privateAccess.mjs": {},
    "@/lib/media/delivery": { deliverMedia: deliver },
  });
}
const request = () => ({ nextUrl: new URL("https://example.test/api/media/" + id), headers: new Headers() });

test("story photos cannot escape audience/expiry checks through generic media delivery",async()=>{
 let reads=0;const api=route({category:"STORY",deliver:async()=>{reads++;return new Response("leak");}});
 assert.equal((await api.GET(request(),{params:{id}})).status,404);assert.equal(reads,0);
});

test("widthless delivery strips GPS and EXIF; corrupt input fails instead of returning the original", async () => {
  const original = await sharp({ create: { width: 16, height: 12, channels: 3, background: "red" } })
    .withExif({ IFD0: { Make: "Private camera" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "50/1 5/1 0/1" } }).jpeg().toBuffer();
  assert.ok((await sharp(original).metadata()).exif);
  const safe = await sanitizeDeliveredImage(original);
  assert.equal((await sharp(safe).metadata()).exif, undefined);
  await assert.rejects(sanitizeDeliveredImage(Buffer.from("broken upload")));
});

test("deleted owners and failed block lookups cannot deliver media", async () => {
  let reads = 0;
  for (const options of [{ ownerStatus: "DEACTIVATED" }, { blockError: { code: "offline" } }]) {
    const response = await route({ ...options, deliver: async () => { reads++; return new Response("leak"); } }).GET(request(), { params: { id } });
    assert.equal(response.status, 404);
  }
  assert.equal(reads, 0);
});

test("authorized media returns bytes without a reusable storage redirect", async () => {
  const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
  const { deliverMedia } = load("src/lib/media/delivery.ts", {
    "@/lib/storage/r2": { getStoredObject: async () => image },
    "./variants.mjs": { sanitizeDeliveredImage },
  });
  const response = await route({ deliver: deliverMedia }).GET(request(), { params: { id } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Location"), null);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Content-Type"), "image/webp");
  assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format, "webp");
});
