/** Opt-in build-time probe; no public endpoint and no production storage access. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
assert.equal(process.env.VERCEL_ENV, 'preview', 'Probe requires Vercel Preview');
assert.equal(bucket, 'intimo-staging-media', 'Only the dedicated staging bucket is allowed');
assert.equal(process.env.CLOUDFLARE_R2_ACCOUNT_ID, 'e9dfc810ae6979dcf5599cedc3e3baf0', 'Unexpected R2 account');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'fuczjjcwtxzzvoxilrme.supabase.co', 'Production database is forbidden');
for (const name of ['CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY']) assert.ok(process.env[name], `${name} required`);
const client = new S3Client({
  region: 'auto', endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID, secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY },
});
const prefix = `acceptance-probes/${randomUUID()}/`;
const key = `${prefix}probe.txt`;
const bytes = Buffer.from('Intimo synthetic staging storage probe. No member data.');
let attempted = false;
try {
  attempted = true; // A timeout may occur after the remote write; still clean up.
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: 'text/plain' }));
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  assert.equal(head.ContentLength, bytes.length);
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  assert.ok(object.Body);
  assert.deepEqual(Buffer.from(await object.Body.transformToByteArray()), bytes);
  console.log('STAGING_STORAGE_PROBE upload/head/read-back PASS');
} finally {
  if (attempted) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    let absent = false;
    try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); }
    catch (error) { if (error?.$metadata?.httpStatusCode === 404) absent = true; else throw error; }
    assert.ok(absent, 'Probe object remains after deletion');
    const remaining = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1 }));
    assert.equal(remaining.Contents?.length ?? 0, 0, 'Probe prefix is not empty');
    console.log('STAGING_STORAGE_PROBE delete/absence/list-cleanup PASS');
  }
  client.destroy();
}
