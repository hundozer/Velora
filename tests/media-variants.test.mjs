import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import { buildImageVariants, parseRequestedWidth, pickVariantWidth, processMediaVariants, variantKey } from "../src/lib/media/variants.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function jpegWithGps(width, height) {
  return sharp({ create: { width, height, channels: 3, background: "#5a4334" } })
    .withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "50/1 5/1 0/1" } })
    .jpeg().toBuffer();
}

test("variants are resized WebP at 160/640/1080 with all metadata (including GPS) removed", async () => {
  const input = await jpegWithGps(1600, 1200);
  assert.ok((await sharp(input).metadata()).exif, "fixture carries EXIF");
  const built = await buildImageVariants(input);
  assert.equal(built.status, "READY");
  assert.deepEqual(built.files.map((f) => f.width), [160, 640, 1080]);
  for (const file of built.files) {
    const meta = await sharp(file.buffer).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, file.width);
    assert.equal(meta.exif, undefined, "EXIF must be stripped");
  }
  assert.match(built.dominantColor, /^#[0-9a-f]{6}$/);
  assert.ok(built.lqip.startsWith("data:image/webp;base64,") && built.lqip.length <= 2048);
});

test("small images are never enlarged and animated images keep their original", async () => {
  const small = await buildImageVariants(await sharp({ create: { width: 120, height: 90, channels: 3, background: "#fff" } }).png().toBuffer());
  assert.deepEqual(small.files.map((f) => f.width), [120]);
  // Minimal two-frame animated GIF (1x1).
  const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAAQABAAACAkQBACH5BAQKAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  assert.equal((await buildImageVariants(gif)).status, "SKIPPED");
});

test("only the fixed widths can be requested and the closest stored variant is chosen", () => {
  assert.equal(parseRequestedWidth("640"), 640);
  assert.equal(parseRequestedWidth("641"), null);
  assert.equal(parseRequestedWidth("../x"), null);
  const variants = { 160: "a", 640: "b", 1080: "c" };
  assert.equal(pickVariantWidth(variants, 160), 160);
  assert.equal(pickVariantWidth(variants, 1080), 1080);
  assert.equal(pickVariantWidth({ 120: "a" }, 640), 120);
  assert.equal(pickVariantWidth(null, 640), null);
  assert.equal(variantKey("abc", 640), "variants/abc/640.webp");
});

test("processing writes variants under variants/{id}/ and records the outcome; failures never throw", async () => {
  const input = await jpegWithGps(800, 600);
  const writes = [];
  let recorded;
  const ok = await processMediaVariants({
    media: { id: "m1", object_key: "photos/x.jpg", mime_type: "image/jpeg" },
    readObject: async () => input,
    writeObject: async (key, _b, type) => { writes.push([key, type]); },
    recordResult: async (r) => { recorded = r; },
  });
  assert.equal(ok.status, "READY");
  assert.deepEqual(writes.map((w) => w[0]), ["variants/m1/160.webp", "variants/m1/640.webp"]);
  assert.ok(writes.every((w) => w[1] === "image/webp"));
  assert.equal(recorded.status, "READY");

  let failedRecord;
  const failed = await processMediaVariants({
    media: { id: "m2", object_key: "k", mime_type: "image/jpeg" },
    readObject: async () => { throw new Error("storage down"); },
    writeObject: async () => {},
    recordResult: async (r) => { failedRecord = r; },
  });
  assert.equal(failed.status, "FAILED");
  assert.equal(failedRecord.status, "FAILED");

  let timedOutRecorded = false;
  const slow = await processMediaVariants({
    media: { id: "m3", object_key: "k", mime_type: "image/jpeg" },
    readObject: () => new Promise(() => {}),
    writeObject: async () => {},
    recordResult: async () => { timedOutRecorded = true; },
    timeoutMs: 20,
  });
  assert.equal(slow.reason, "timeout");
  assert.equal(timedOutRecorded, false, "a timeout stays pending so the backfill retries it");
  assert.equal((await processMediaVariants({ media: { id: "v", object_key: "k", mime_type: "video/mp4" }, readObject: async () => input, writeObject: async () => {}, recordResult: async () => {} })).status, "SKIPPED");
});

test("serving keeps grant-based and chat media uncached and reads variants without touching the auth query", async () => {
  const route = await read("src/app/api/media/[id]/route.ts");
  assert.match(route, /deliverMedia\(objectKey, media\.mime_type/);
  assert.match(route, /"private, no-store"/);
  // The authorisation select must not depend on the new column (works before the migration).
  const authSelect = route.match(/select\("id,owner_id,object_key,visibility,upload_status,moderation_status,processing_status,category,mime_type"\)/);
  assert.ok(authSelect, "authorisation select unchanged");
  assert.ok(route.indexOf('select("variants")') > route.indexOf("if (!allowed) return"), "variants are read only after authorisation");
  assert.match(route, /media-view-thumb:/);
});

test("deleting media, by the owner or by retention, removes its variants too", async () => {
  const route = await read("src/app/api/media/[id]/route.ts");
  const retention = await read("src/lib/privacy/retention.ts");
  const r2 = await read("src/lib/storage/r2.ts");
  assert.match(route, /deleteStoredObject\(media\.object_key\); await deleteVariantObjects\(media\.id\)/);
  assert.match(retention, /deleteVariantObjects\(String\(item\.id\)\)/);
  assert.match(r2, /Prefix: `variants\/\$\{mediaId\}\/`/);
  assert.match(r2, /if \(!objectKey\.startsWith\("variants\/"\)/);
});

test("upload completion builds variants best-effort after the upload is finalised and audited", async () => {
  const route = await read("src/app/api/media/[id]/complete/route.ts");
  const audit = route.indexOf('action: "MEDIA_UPLOAD_COMPLETED"');
  const variants = route.indexOf("processMediaVariants({");
  assert.ok(audit > 0 && variants > audit);
});
