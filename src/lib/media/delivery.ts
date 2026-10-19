import { getStoredObject, getStoredObjectStream } from "@/lib/storage/r2";
import { sanitizeDeliveredImage } from "./variants.mjs";

/** Authorize before calling. No signed storage URL leaves this boundary. */
export async function deliverMedia(objectKey: string, mimeType: string, range?: string) {
  const headers = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow, noarchive" });
  if (mimeType.startsWith("image/")) {
    const safe = await sanitizeDeliveredImage(await getStoredObject(objectKey));
    headers.set("Content-Type", "image/webp");
    return new Response(new Uint8Array(safe), { headers });
  }
  const stored = await getStoredObjectStream(objectKey, range);
  headers.set("Content-Type", stored.contentType || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  if (stored.contentLength !== undefined) headers.set("Content-Length", String(stored.contentLength));
  if (stored.contentRange) headers.set("Content-Range", stored.contentRange);
  return new Response(stored.body, { status: stored.contentRange ? 206 : 200, headers });
}
