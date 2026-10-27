import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import { MAX_VIDEO_BYTES, sanitizeVideo } from "../src/lib/media/sanitizeVideo.mjs";

const run = promisify(execFile);
test("video remux drops GPS and comment metadata while keeping playable frames", async () => {
  const dir = await mkdtemp(join(tmpdir(), "intimo-video-test-"));
  try {
    const source = join(dir, "source.mp4");
    const output = join(dir, "safe.mp4");
    await run(ffmpeg, ["-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:d=1", "-metadata", "location=+50.0000+014.0000/", "-metadata", "comment=PRIVATE GPS MARKER", "-c:v", "mpeg4", source]);
    const original = await readFile(source);
    assert.ok(original.includes(Buffer.from("PRIVATE GPS MARKER")));
    const safe = await sanitizeVideo(original, "video/mp4");
    assert.ok(!safe.includes(Buffer.from("PRIVATE GPS MARKER")));
    assert.ok(!safe.includes(Buffer.from("+50.0000+014.0000/")));
    await writeFile(output, safe);
    await run(ffmpeg, ["-v", "error", "-i", output, "-f", "null", "-"]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("video remux rejects unsupported and oversized inputs", async () => {
  await assert.rejects(sanitizeVideo(Buffer.from("x"), "video/quicktime"));
  await assert.rejects(sanitizeVideo(Buffer.alloc(MAX_VIDEO_BYTES + 1), "video/mp4"));
});
