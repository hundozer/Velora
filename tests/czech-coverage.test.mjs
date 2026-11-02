import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Every user-facing string goes through t()/tr() and has a Czech translation, so the
// Czech site never shows English. Admin tools and API code are English-only.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAME_IN_CZECH = new Set(["Intimo", "Intimo · 18+", "© {getFullYear} Intimo", "{withinKm} km", "{km} km", "Spam", "English text"]);

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) { if (!["admin", "api"].includes(name)) files(p, out); }
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

test("every translatable string in the app has a Czech translation", () => {
  const cs = JSON.parse(readFileSync(path.join(root, "src/locales/cs/phrases.json"), "utf8"));
  const missing = [];
  for (const file of files(path.join(root, "src"))) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/(?<![\w.])(?:t|tr)\("((?:[^"\\]|\\.)*)"/g)) {
      const key = JSON.parse(`"${m[1]}"`);
      if (/^[a-z]+(\.[a-z_]+)+$/.test(key) || !/[A-Za-z]{2}/.test(key) || SAME_IN_CZECH.has(key)) continue;
      if (!cs[key]) missing.push(`${path.relative(root, file)}: ${key}`);
    }
  }
  assert.deepEqual(missing, [], `Add these to src/locales/cs/phrases.json:\n${missing.join("\n")}`);
});
