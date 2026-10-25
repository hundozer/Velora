import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

async function sourceFiles(dir) {
  const entries = await fs.readdir(path.join(root, dir), { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => entry.isDirectory() ? sourceFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
  return files.flat().filter((file) => /\.(ts|tsx)$/.test(file));
}

test("rate limits are shared in Postgres with an in-memory fallback", async () => {
  const limiter = await read("src/lib/security/rateLimiter.ts");
  assert.match(limiter, /export async function checkRateLimit\(/);
  assert.match(limiter, /db\.rpc\("intimo_rate_limit_hit"/);
  assert.match(limiter, /return checkInMemory\(identifier, limit, windowSeconds\);/);
  const sql = await read("supabase/migrations/20261028000000_rate_limits.sql");
  assert.match(sql, /on conflict \(key\) do update/);
  assert.match(sql, /revoke all on function public\.intimo_rate_limit_hit\(text, integer, integer\) from public, anon, authenticated;/);
});

test("every caller awaits the limiter (an un-awaited Promise would never block)", async () => {
  for (const file of await sourceFiles("src")) {
    if (file.endsWith("rateLimiter.ts")) continue;
    const source = await read(file);
    const calls = source.match(/checkRateLimit\(/g) || [];
    const awaited = source.match(/\(await checkRateLimit\(/g) || [];
    const imports = source.match(/import \{[^}]*checkRateLimit[^}]*\}/g) || [];
    assert.equal(calls.length, awaited.length, `${file} has an un-awaited checkRateLimit call`);
    if (calls.length) assert.equal(imports.length, 1, file);
  }
});
