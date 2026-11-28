import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = path => readFile(new URL("../"+path, import.meta.url), "utf8");
test("migrated email templates use approved flat brand palette", async () => {
  for (const file of ["authEmails.ts", "emailTemplates.ts", "returnEmails.ts"]) {
    const source = await read("src/lib/notifications/"+file);
    assert.doesNotMatch(source, /#(?:d4af37|f3e5ab)|rgba?\(\s*212\s*,\s*175\s*,\s*55\b|linear-gradient\s*\(|box-shadow\s*:/i, file);
    for (const color of ["#191C20", "#F1E8DC", "#E0704F"]) assert.ok(source.includes(color), file+" "+color);
  }
});
test("authentication shell uses semantic design tokens", async () => {
  const source = await read("src/components/auth/AuthShell.tsx");
  assert.doesNotMatch(source, /velora-(?:gold|amber|roseGold|borderGold|copper)/);
  assert.match(source, /focus:border-velora-accent/);
  assert.match(source, /bg-velora-warm/);
});
