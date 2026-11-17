// Copies every object from one R2 bucket to another, for moving production media out of
// the shared staging bucket (docs/SECURITY_CHECKUP_2026-11.md). It only reads the source
// and only writes the destination: nothing is ever deleted. Safe to re-run; objects that
// already exist at the destination with the same size are skipped.
//
// Dry run (lists what would be copied):
//   R2_ACCOUNT_ID=... \
//   R2_SOURCE_BUCKET=intimo-staging-media R2_SOURCE_KEY_ID=... R2_SOURCE_SECRET=... \
//   R2_TARGET_BUCKET=intimo-media R2_TARGET_KEY_ID=... R2_TARGET_SECRET=... \
//   node scripts/copy-r2-bucket.mjs
// Copy: add --copy at the end.
import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function client(accountId, accessKeyId, secretAccessKey) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function listAll(s3, bucket) {
  const objects = [];
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const item of page.Contents || []) objects.push({ key: item.Key, size: item.Size ?? 0 });
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

async function existingSize(s3, bucket, key) {
  try { return (await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ContentLength ?? null; }
  catch (error) { if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") return null; throw error; }
}

/** Plans and (optionally) performs the copy. Returns a summary; never deletes anything. */
export async function copyBucket({ source, target, sourceBucket, targetBucket, execute, log = console.log }) {
  if (sourceBucket === targetBucket) throw new Error("Source and target bucket must differ");
  const objects = await listAll(source, sourceBucket);
  const summary = { total: objects.length, bytes: objects.reduce((sum, o) => sum + o.size, 0), copied: 0, skipped: 0 };
  for (const object of objects) {
    if ((await existingSize(target, targetBucket, object.key)) === object.size) { summary.skipped++; continue; }
    if (!execute) { log(`would copy ${object.key} (${object.size} bytes)`); continue; }
    const got = await source.send(new GetObjectCommand({ Bucket: sourceBucket, Key: object.key }));
    const body = Buffer.from(await got.Body.transformToByteArray());
    if (body.length !== object.size) throw new Error(`Size changed while reading ${object.key}`);
    await target.send(new PutObjectCommand({ Bucket: targetBucket, Key: object.key, Body: body, ContentType: got.ContentType, CacheControl: got.CacheControl, ContentLength: body.length }));
    summary.copied++;
    log(`copied ${object.key}`);
  }
  if (execute) {
    // Verify: every source object exists at the target with the same size.
    const copied = new Map((await listAll(target, targetBucket)).map((o) => [o.key, o.size]));
    const missing = objects.filter((o) => copied.get(o.key) !== o.size).map((o) => o.key);
    if (missing.length) throw new Error(`Verification failed for ${missing.length} object(s): ${missing.slice(0, 5).join(", ")}`);
    summary.verified = true;
  }
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const accountId = required("R2_ACCOUNT_ID");
  const execute = process.argv.includes("--copy");
  const summary = await copyBucket({
    source: client(accountId, required("R2_SOURCE_KEY_ID"), required("R2_SOURCE_SECRET")),
    target: client(accountId, required("R2_TARGET_KEY_ID"), required("R2_TARGET_SECRET")),
    sourceBucket: required("R2_SOURCE_BUCKET"),
    targetBucket: required("R2_TARGET_BUCKET"),
    execute,
  });
  console.log(JSON.stringify(summary));
  if (!execute) console.log("Dry run only. Add --copy to copy.");
}
