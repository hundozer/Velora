import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
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
    // R2 delivers the source through an HTTPS signed GET; a local ranged
    // endpoint exercises FFmpeg's remote input path without credentials.
    let ranged = false;
    const server = createServer((req, res) => {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
      if (match) {
        ranged = true;
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), original.length - 1) : original.length - 1;
        res.writeHead(206, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${original.length}`, "Content-Length": end - start + 1 });
        res.end(original.subarray(start, end + 1));
      } else {
        res.writeHead(200, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Length": original.length });
        res.end(original);
      }
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    let safe;
    try { safe = await sanitizeVideo(`http://127.0.0.1:${server.address().port}/signed-source`, "video/mp4", original.length); }
    finally { await new Promise(resolve => server.close(resolve)); }
    assert.ok(ranged);
    assert.ok(!safe.includes(Buffer.from("PRIVATE GPS MARKER")));
    assert.ok(!safe.includes(Buffer.from("+50.0000+014.0000/")));
    await writeFile(output, safe);
    await run(ffmpeg, ["-v", "error", "-i", output, "-f", "null", "-"]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("video remux rejects unsupported and oversized inputs", async () => {
  await assert.rejects(sanitizeVideo("source.mov", "video/quicktime", 1));
  await assert.rejects(sanitizeVideo("source.mp4", "video/mp4", MAX_VIDEO_BYTES + 1));
});
