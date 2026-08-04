import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export interface PresignedUploadParams {
  fileName: string;
  fileType: string;
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
