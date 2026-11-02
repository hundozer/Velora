import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Intimo is fully bilingual: Czech and English, switchable everywhere", async () => {
  const context = await read("src/context/LanguageContext.tsx");
  assert.match(context, /\{ code: "cs", name: "Czech", nativeName: "Čeština" \}/);
  assert.match(context, /\{ code: "en", name: "English", nativeName: "English" \}/);
  assert.match(context, /document\.cookie = `\$\{LANG_COOKIE\}=\$\{lang\}/, "the choice is saved where the server can read it");
  assert.match(await read("src/components/layout/Navbar.tsx"), /<LanguageSwitch \/>/, "header switch is always visible");
  assert.match(await read("src/app/me/page.tsx"), /<LanguageSwitch variant="list" \/>/);
  assert.match(await read("src/components/community/PublicCommunityHome.tsx"), /<LanguageSwitch variant="hero" \/>/, "big flag chooser on the homepage");
  const sw = await read("src/components/i18n/LanguageSwitch.tsx");
  assert.match(sw, /<svg/, "flags are SVG, not emoji");
});

test("visitors in the Czech Republic get Czech by default, rendered on the server", async () => {
  const translate = await read("src/lib/i18n/translate.ts");
  assert.match(translate, /if \(\(country \|\| ""\)\.toUpperCase\(\) === "CZ"\) return "cs";/);
  assert.match(translate, /first\.startsWith\("cs"\) \? "cs" : "en"/);
  const server = await read("src/lib/i18n/server.ts");
  assert.match(server, /cookies\(\)\.get\(LANG_COOKIE\)/, "a saved choice wins");
  assert.match(server, /x-vercel-ip-country/);
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /<html lang=\{lang\}>/);
  assert.match(layout, /<LanguageProvider initialLanguage=\{lang\}>/);
});

test("every Czech translation keeps the English placeholders", async () => {
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  assert.ok(Object.keys(cs).length > 1500);
  const names = (s) => new Set(s.match(/\{\w+\}/g) || []);
  for (const [en, value] of Object.entries(cs)) {
    for (const name of names(value)) assert.ok(names(en).has(name), `${en} → ${value} uses ${name}`);
  }
});
