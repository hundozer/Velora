import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";

const run = promisify(execFile);
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

// Remux only the first video/audio streams. No source chapters, attachments,
// subtitles, tags, location or device metadata survive into the output.
export async function sanitizeVideo(input, mimeType) {
  if (!Buffer.isBuffer(input) || !input.length || input.length > MAX_VIDEO_BYTES || !["video/mp4", "video/webm"].includes(mimeType) || !ffmpeg) throw new Error("Unsupported video");
  const ext = mimeType === "video/mp4" ? "mp4" : "webm";
  const dir = await mkdtemp(join(tmpdir(), "intimo-video-"));
  try {
    const source = join(dir, `source.${ext}`);
    const output = join(dir, `safe.${ext}`);
    await writeFile(source, input, { flag: "wx" });
    await run(ffmpeg, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", source, "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_metadata:s", "-1", "-map_chapters", "-1", "-c", "copy", ...(ext === "mp4" ? ["-movflags", "+faststart"] : []), output], { timeout: 45_000, maxBuffer: 1024 * 1024 });
    const safe = await readFile(output);
    if (!safe.length || safe.length > MAX_VIDEO_BYTES) throw new Error("Video processing failed");
    return safe;
  } finally { await rm(dir, { recursive: true, force: true }); }
}
