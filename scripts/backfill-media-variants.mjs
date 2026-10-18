// Generates resized variants for images uploaded before variants existed.
// Idempotent and resumable: only touches IMAGE rows that are AVAILABLE with no
// variants_status yet. Originals are never modified or deleted.
//
//   node scripts/backfill-media-variants.mjs --dry-run
//   node scripts/backfill-media-variants.mjs --limit 200
//
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY,
// CLOUDFLARE_R2_BUCKET_NAME. Needs migration 20261101_media_variants.sql applied.
import { createClient } from "@supabase/supabase-js";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { processMediaVariants } from "../src/lib/media/variants.mjs";

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Math.max(1, Number.parseInt(process.argv[limitArg + 1], 10) || 100) : 100;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const db = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "intimo-media";
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${required("CLOUDFLARE_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: { accessKeyId: required("CLOUDFLARE_R2_ACCESS_KEY_ID"), secretAccessKey: required("CLOUDFLARE_R2_SECRET_ACCESS_KEY") },
});

const readObject = async (key) => {
  const result = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return Buffer.from(await result.Body.transformToByteArray());
};
const writeObject = async (key, body, contentType, cacheControl) => {
  if (!key.startsWith("variants/")) throw new Error("Refusing to write outside variants/");
  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
};

const { data: pending, error } = await db
  .from("media_objects")
  .select("id,object_key,mime_type")
  .eq("media_type", "IMAGE")
  .eq("upload_status", "AVAILABLE")
  .is("variants_status", null)
  .order("created_at", { ascending: true })
  .limit(limit);
if (error) throw new Error(`Could not list pending media: ${error.message}`);

console.log(`${pending.length} image(s) without variants${dryRun ? " (dry run, nothing written)" : ""}`);
const tally = { READY: 0, SKIPPED: 0, FAILED: 0 };
for (const media of pending) {
  if (dryRun) { console.log(`would process ${media.id}`); continue; }
  const result = await processMediaVariants({
    media,
    readObject,
    writeObject,
    timeoutMs: 60_000,
    recordResult: async (r) => {
      const { error: updateError } = await db.from("media_objects").update({ variants_status: r.status, variants: r.variants ?? null, dominant_color: r.dominantColor ?? null, lqip: r.lqip ?? null }).eq("id", media.id).is("variants_status", null);
      if (updateError) throw updateError;
    },
  });
  tally[result.status] = (tally[result.status] ?? 0) + 1;
  console.log(`${media.id} ${result.status}${result.reason ? ` (${result.reason})` : ""}`);
}
if (!dryRun) console.log(`done: ${JSON.stringify(tally)}`);
