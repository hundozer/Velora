// Image variants for the editorial redesign (Phase 1).
// Pure buffer-in / buffers-out so the upload route, the backfill script and the tests
// share one implementation. Storage and authorisation live elsewhere.
import sharp from "sharp";

export const VARIANT_WIDTHS = [160, 640, 1080];
export const VARIANT_CONTENT_TYPE = "image/webp";
// Variants are immutable per media id; access control happens before the signed URL.
export const VARIANT_CACHE_CONTROL = "private, max-age=31536000, immutable";
const MAX_INPUT_PIXELS = 50_000_000;

export function variantKey(mediaId, width) {
  return `variants/${mediaId}/${width}.webp`;
}

/** Picks the smallest stored width that covers the requested one, else the largest. */
export function pickVariantWidth(variants, requested) {
  const widths = Object.keys(variants || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!widths.length) return null;
  return widths.find((w) => w >= requested) ?? widths[widths.length - 1];
}

export function parseRequestedWidth(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return VARIANT_WIDTHS.includes(n) ? n : null;
}

/**
 * Builds resized WebP variants, a dominant colour and a tiny blurred placeholder.
 * EXIF orientation is applied and all metadata (including GPS) is stripped.
 * Returns { status: "SKIPPED" } for animated images, which keep their original.
 */
export async function buildImageVariants(input) {
  const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: true });
  const meta = await image.metadata();
  if ((meta.pages ?? 1) > 1) return { status: "SKIPPED", reason: "animated" };
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const width = meta.orientation && meta.orientation >= 5 ? meta.height : meta.width;
  if (!width) throw new Error("Image has no readable dimensions");

  const targets = VARIANT_WIDTHS.filter((w) => w <= width);
  if (!targets.length) targets.push(Math.max(1, Math.min(width, VARIANT_WIDTHS[0])));
  const files = [];
  for (const w of targets) {
    const buffer = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 160 ? 70 : 78, effort: 4 }).toBuffer();
    files.push({ width: w, buffer });
  }

  const { dominant } = await base.clone().resize(64, 64, { fit: "inside" }).stats();
  const dominantColor = "#" + [dominant.r, dominant.g, dominant.b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
  const tiny = await base.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  const lqip = `data:image/webp;base64,${tiny.toString("base64")}`;
  return { status: "READY", files, dominantColor, lqip, sourceWidth: width };
}

/**
 * Reads the original, writes variants, records the result. Storage and database are
 * injected so the upload route and the backfill script share the same steps.
 * Never throws: a failure is recorded as FAILED and the original keeps being served.
 */
export async function processMediaVariants({ media, readObject, writeObject, recordResult, timeoutMs = 8000 }) {
  if (!media?.id || !media.object_key) return { status: "FAILED", reason: "missing media" };
  if (!String(media.mime_type || "").startsWith("image/")) return { status: "SKIPPED", reason: "not an image" };
  let timer;
  const work = (async () => {
    const original = await readObject(media.object_key);
    const built = await buildImageVariants(original);
    if (built.status !== "READY") return built;
    const variants = {};
    for (const file of built.files) {
      const key = variantKey(media.id, file.width);
      await writeObject(key, file.buffer, VARIANT_CONTENT_TYPE, VARIANT_CACHE_CONTROL);
      variants[String(file.width)] = key;
    }
    return { status: "READY", variants, dominantColor: built.dominantColor, lqip: built.lqip };
  })();
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve({ status: "FAILED", reason: "timeout" }), timeoutMs); });
  let result;
  try { result = await Promise.race([work, timeout]); }
  catch (error) { result = { status: "FAILED", reason: error instanceof Error ? error.message.slice(0, 120) : "error" }; }
  finally { clearTimeout(timer); }
  // A timeout leaves variants_status empty so the backfill retries it later.
  if (result.reason !== "timeout") {
    try { await recordResult(result); } catch { /* columns may not exist before the migration is applied */ }
  }
  return result;
}

/** Final image-delivery boundary: never return an uploaded original with metadata.
 * Re-encode even on variant failure, for widthless requests and animated uploads.
 * Decode/storage failures propagate: callers return 503 instead of leaking the source.
 */
export async function sanitizeDeliveredImage(input) {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: true })
    .rotate().webp({ quality: 85 }).toBuffer();
}
