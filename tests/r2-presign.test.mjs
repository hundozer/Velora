import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("R2 client opts out of default request checksums", async () => {
  const source = await fs.readFile(path.join(root, "src/lib/storage/r2.ts"), "utf8");
  assert.match(source, /requestChecksumCalculation: "WHEN_REQUIRED"/);
});

test("presigned PutObject URLs carry no baked-in body checksum", async () => {
  const client = new S3Client({
    region: "auto",
    endpoint: "https://account.r2.cloudflarestorage.com",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const url = new URL(await getSignedUrl(client, new PutObjectCommand({ Bucket: "b", Key: "k", ContentType: "image/jpeg" }), { expiresIn: 900 }));
  const keys = [...url.searchParams.keys()].map((key) => key.toLowerCase());
  assert.ok(!keys.includes("x-amz-checksum-crc32"), `unexpected checksum param in ${keys}`);
  assert.ok(!keys.includes("x-amz-sdk-checksum-algorithm"));
});
