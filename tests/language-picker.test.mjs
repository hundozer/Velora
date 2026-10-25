import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("only languages that cover the whole app can be chosen", async () => {
  const context = await read("src/context/LanguageContext.tsx");
  assert.match(context, /AVAILABLE_LANGUAGES: LanguageInfo\[\] = LANGUAGES\.filter\(\(lang\) => lang\.code === "en"\)/);
  assert.match(context, /if \(!AVAILABLE\.has\(lang\)\) return;/, "unavailable languages can't be set");
  assert.match(context, /localStorage\.setItem\("intimo_lang", "en"\)/, "an earlier choice falls back to English");
  for (const file of ["src/components/layout/Navbar.tsx", "src/app/me/page.tsx"]) {
    const source = await read(file);
    assert.match(source, /AVAILABLE_LANGUAGES\.length > 1 &&/, `${file} hides the picker while only English exists`);
    assert.doesNotMatch(source, /\bLANGUAGES\.map/, `${file} must not list untranslated languages`);
  }
  assert.doesNotMatch(await read("src/app/settings/page.tsx"), /Display Language|SUPPORTED_LANGUAGES/);
});
