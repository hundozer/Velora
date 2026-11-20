import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("mobile chat fills the root viewport rather than adding a second screen height", () => {
  const page = read("src/app/messages/page.tsx");
  const chat = read("src/components/chat/ChatWindow.tsx");
  const css = read("src/app/globals.css");
  assert.match(page, /data-intimo-messages-page/);
  assert.match(page, /intimo-messages-page/);
  assert.match(chat, /grid h-full min-h-0/);
  assert.doesNotMatch(chat, /h-\[calc\(100svh-4rem\)\]/);
  assert.match(css, /body:has\(\.intimo-messages-page\)/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /padding-top: env\(safe-area-inset-top/);
  assert.match(css, /padding-bottom: calc\(4rem \+ env\(safe-area-inset-bottom/);
  assert.match(read("src/components/layout/Footer.tsx"), /pathname\.startsWith\("\/messages"\)/);
});

test("chat messages scroll independently instead of shifting the entire iPhone PWA", () => {
  const chat = read("src/components/chat/ChatWindow.tsx");
  assert.doesNotMatch(chat, /\.scrollIntoView\(/);
  assert.match(chat, /pane\.scrollTop = pane\.scrollHeight/);
  assert.match(chat, /ref=\{threadScrollRef\}/);
  assert.match(chat, /min-h-0 flex-1 overscroll-contain overflow-y-auto/);
  assert.match(chat, /shrink-0 border-t border-velora-line/);
  assert.match(chat, /min-w-0 flex-1 items-center/);
});

test("keyboard focus makes room for the composer and keeps touch-friendly controls", () => {
  const css = read("src/app/globals.css");
  const chat = read("src/components/chat/ChatWindow.tsx");
  assert.match(css, /textarea:focus\) > main/);
  assert.match(css, /textarea:focus\) > nav\[aria-label\]/);
  assert.match(chat, /flex h-12 w-12 shrink-0/);
  assert.match(chat, /min-h-12 min-w-0 flex-1/);
  assert.match(read("src/components/layout/MobileNavigation.tsx"), /safe-area-inset-bottom/);
});
