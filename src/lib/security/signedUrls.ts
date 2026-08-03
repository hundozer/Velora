/**
 * Short-Lived Signed Media URLs Utility
 * Prevents direct media CDN link exfiltration, hotlinking, and unauthorized vault access.
 */

export interface SignedUrlOptions {
  mediaId: string;
  userId: string;
  expiresInSeconds?: number;
}

export interface SignedUrlResult {
  signedUrl: string;
  token: string;
  expiresAt: number;
}

// Secret key for HMAC token signing (In production: process.env.MEDIA_SIGNING_SECRET)
const SIGNING_SECRET = "velora_sec_token_key_2026_x89a";

/**
 * Simple pseudo-HMAC hash generator for token verification
 */
function generateSignature(mediaId: string, userId: string, expiresAt: number): string {
  const payload = `${mediaId}:${userId}:${expiresAt}:${SIGNING_SECRET}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a short-lived signed URL for private media
 */
export function generateSignedMediaUrl(
  rawUrl: string,
  options: SignedUrlOptions
): SignedUrlResult {
  const expiresIn = options.expiresInSeconds || 300; // Default 5 minutes
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const token = generateSignature(options.mediaId, options.userId, expiresAt);

  const delimiter = rawUrl.includes("?") ? "&" : "?";
  const signedUrl = `${rawUrl}${delimiter}st=${token}&exp=${expiresAt}&uid=${options.userId}`;

  return {
    signedUrl,
    token,
    expiresAt,
  };
}

/**
 * Verify a signed URL token
 */
export function verifySignedMediaUrl(
  mediaId: string,
  userId: string,
  token: string,
  expiresAt: number
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) {
    return false; // Expired token
  }

  const expectedToken = generateSignature(mediaId, userId, expiresAt);
  return token === expectedToken;
}
