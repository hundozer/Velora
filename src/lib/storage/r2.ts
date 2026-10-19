import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "intimo-media";
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || "";

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey);

// Initialize S3 client configured for Cloudflare R2
const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      // SDK >= 3.729 otherwise signs a CRC32 of the (empty) presign body into
      // every PutObject URL, so R2 rejects the browser's real upload.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export interface PresignedUploadParams {
  fileName: string;
  fileType: string;
  fileSize: number;
  folder?: "photos" | "videos" | "avatars" | "covers" | "general";
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  isMock: boolean;
}

/**
 * Generates a presigned PUT upload URL for direct-to-cloud uploads to Cloudflare R2.
 */
export async function getPresignedUploadUrl({
  fileName,
  fileType,
  fileSize,
  folder = "general",
}: PresignedUploadParams): Promise<PresignedUploadResponse> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const objectKey = `${folder}/${timestamp}_${randomId}_${sanitizedName}`;

  if (!isR2Configured || !r2Client) {
    // Development fallback mock
    const mockPublicUrl = publicDomain
      ? `${publicDomain.replace(/\/$/, "")}/${objectKey}`
      : `https://intimo.live/uploads/${objectKey}`;

    return {
      uploadUrl: `https://mock-r2-upload.intimo.live/upload?key=${encodeURIComponent(objectKey)}`,
      publicUrl: mockPublicUrl,
      objectKey,
      isMock: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  // Presigned URL valid for 15 minutes (900 seconds)
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

  const publicUrl = publicDomain
    ? `${publicDomain.replace(/\/$/, "")}/${objectKey}`
    : `https://${bucketName}.${accountId}.r2.dev/${objectKey}`;

  return {
    uploadUrl,
    publicUrl,
    objectKey,
    isMock: false,
  };
}

export async function getPresignedDownloadUrl(objectKey: string): Promise<string> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
  return getSignedUrl(r2Client, command, { expiresIn: 300 });
}

/**
 * Signed URL that stays identical for a whole time window, so the browser can cache
 * the image instead of re-downloading it on every render. Only used for media the
 * caller has already authorised and that is not private-album or chat media.
 * The URL remains valid for at least `windowSeconds` after the window ends.
 */
export async function getCacheableDownloadUrl(objectKey: string, windowSeconds = 1800, now = Date.now()): Promise<{ url: string; maxAgeSeconds: number }> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
  const url = await getSignedUrl(r2Client, command, { expiresIn: windowSeconds * 2, signingDate: new Date(windowStart) });
  const maxAgeSeconds = Math.max(0, Math.floor((windowStart + windowMs - now) / 1000));
  return { url, maxAgeSeconds };
}

export async function getStoredObject(objectKey: string): Promise<Buffer> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  const result = await r2Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
  if (!result.Body) throw new Error("Stored object is empty");
  return Buffer.from(await result.Body.transformToByteArray());
}

export async function putStoredObject(objectKey: string, body: Buffer, contentType: string, cacheControl: string): Promise<void> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  if (!objectKey.startsWith("variants/") || objectKey.includes("..")) throw new Error("Invalid variant key");
  await r2Client.send(new PutObjectCommand({ Bucket: bucketName, Key: objectKey, Body: body, ContentType: contentType, CacheControl: cacheControl }));
}

export async function inspectStoredObject(objectKey: string) {
  if (!isR2Configured || !r2Client) return null;
  const result = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }));
  return { byteSize: result.ContentLength ?? 0, mimeType: result.ContentType ?? "" };
}

export async function deleteStoredObject(objectKey: string): Promise<void> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  if (!objectKey || objectKey.includes("..") || objectKey.startsWith("/")) throw new Error("Invalid object key");
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }));
}

/** Removes every resized copy of a media object (variants/{mediaId}/...). */
export async function deleteVariantObjects(mediaId: string): Promise<void> {
  if (!isR2Configured || !r2Client) throw new Error("Private media storage is unavailable");
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) throw new Error("Invalid media identifier");
  const listed = await r2Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: `variants/${mediaId}/` }));
  for (const item of listed.Contents ?? []) {
    if (item.Key) await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.Key }));
  }
}

/** Proxy non-image media without buffering the entire upload in a Function. */
export async function getStoredObjectStream(objectKey: string, range?: string) {
  if (!r2Client) throw new Error("Private media storage is unavailable");
  const result = await r2Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey, Range: range }));
  if (!result.Body) throw new Error("Stored object is empty");
  return { body: result.Body.transformToWebStream(), contentType: result.ContentType,
    contentLength: result.ContentLength, contentRange: result.ContentRange };
}
