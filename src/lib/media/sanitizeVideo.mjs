import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";

const run = promisify(execFile);
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

// Remux only the first video/audio streams. No source chapters, attachments,
// subtitles, tags, location or device metadata survive into the output.
export async function sanitizeVideo(inputUrl, mimeType, inputBytes) {
  if (typeof inputUrl !== "string" || !inputUrl || !Number.isSafeInteger(inputBytes) || inputBytes < 1 || inputBytes > MAX_VIDEO_BYTES || !["video/mp4", "video/webm"].includes(mimeType) || !ffmpeg) throw new Error("Unsupported video");
  const ext = mimeType === "video/mp4" ? "mp4" : "webm";
  const dir = await mkdtemp(join(tmpdir(), "intimo-video-"));
  try {
    const output = join(dir, `safe.${ext}`);
    // FFmpeg reads the private, short-lived R2 GET URL with range requests.
    // Only the sanitized output occupies /tmp (500 MB on Vercel).
    await run(ffmpeg, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", inputUrl, "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_metadata:s", "-1", "-map_chapters", "-1", "-c", "copy", ...(ext === "mp4" ? ["-movflags", "+faststart"] : []), output], { timeout: 180_000, maxBuffer: 1024 * 1024 });
    const safe = await readFile(output);
    if (!safe.length || safe.length > MAX_VIDEO_BYTES) throw new Error("Video processing failed");
    return safe;
  } finally { await rm(dir, { recursive: true, force: true }); }
}
