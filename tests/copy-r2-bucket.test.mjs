import assert from "node:assert/strict";
import test from "node:test";
import { copyBucket } from "../scripts/copy-r2-bucket.mjs";

/** In-memory S3 stand-in that understands the four commands the script uses. */
function fakeS3(buckets) {
  const calls = [];
  return { calls, async send(command) {
    const name = command.constructor.name; const input = command.input; calls.push(name);
    const store = buckets[input.Bucket] ??= new Map();
    if (name === "ListObjectsV2Command") return { Contents: [...store].map(([Key, o]) => ({ Key, Size: o.body.length })), IsTruncated: false };
    if (name === "HeadObjectCommand") { const o = store.get(input.Key); if (!o) throw Object.assign(new Error("nf"), { name: "NotFound" }); return { ContentLength: o.body.length }; }
    if (name === "GetObjectCommand") { const o = store.get(input.Key); return { ContentType: o.type, CacheControl: o.cache, Body: { transformToByteArray: async () => o.body } }; }
    if (name === "PutObjectCommand") { store.set(input.Key, { body: Buffer.from(input.Body), type: input.ContentType, cache: input.CacheControl }); return {}; }
    throw new Error(`unexpected ${name}`);
  } };
}

test("dry run copies nothing; --copy copies everything, keeps types and verifies; re-run skips; never deletes", async () => {
  const buckets = { src: new Map([["avatars/a.jpg", { body: Buffer.from("aaaa"), type: "image/jpeg", cache: null }], ["variants/1/640.webp", { body: Buffer.from("bb"), type: "image/webp", cache: "private, max-age=31536000, immutable" }]]) };
  const s3 = fakeS3(buckets);
  const args = { source: s3, target: s3, sourceBucket: "src", targetBucket: "dst", log: () => {} };

  const dry = await copyBucket({ ...args, execute: false });
  assert.deepEqual(dry, { total: 2, bytes: 6, copied: 0, skipped: 0 });
  assert.equal(buckets.dst.size, 0);

  const run = await copyBucket({ ...args, execute: true });
  assert.deepEqual(run, { total: 2, bytes: 6, copied: 2, skipped: 0, verified: true });
  assert.equal(buckets.dst.get("variants/1/640.webp").type, "image/webp");
  assert.equal(buckets.dst.get("variants/1/640.webp").cache, "private, max-age=31536000, immutable");
  assert.equal(buckets.src.size, 2, "source untouched");

  const again = await copyBucket({ ...args, execute: true });
  assert.equal(again.copied, 0); assert.equal(again.skipped, 2);
  assert.ok(!s3.calls.some((name) => /Delete/.test(name)));
  await assert.rejects(copyBucket({ ...args, targetBucket: "src", execute: true }), /must differ/);
});
