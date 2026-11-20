import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../"+path, import.meta.url),"utf8");

test("single shared safe-area contract protects iPhone status bar on member pages", () => {
 const css=read("src/app/globals.css");
 assert.match(css,/body \{\s*padding-top: env\(safe-area-inset-top, 0px\)/);
 assert.match(css,/body::before \{/);
 assert.match(css,/position: fixed;[\s\S]*?height: env\(safe-area-inset-top, 0px\);[\s\S]*?z-index: 60;/);
 assert.match(css,/pointer-events: none/);
 const header=read("src/components/layout/Navbar.tsx");
 assert.match(header,/sticky top-\[env\(safe-area-inset-top\)\] md:top-0/);
 const people=read("src/components/people/MemberPeople.tsx");
 assert.match(people,/sticky top-\[env\(safe-area-inset-top\)\] z-30/);
 assert.doesNotMatch(people,/pt-\[env\(safe-area-inset-top\)\]/);
 assert.match(people,/scroll-mt-\[8rem\]/);
 const tonight=read("src/app/tonight/page.tsx");
 assert.doesNotMatch(tonight,/pt-\[max\(0\.75rem,env\(safe-area-inset-top\)\)\]/);
});

test("Dating mobile headings are responsive and category strip is horizontally scrollable", () => {
 const dating=read("src/app/dating/page.tsx");
 assert.match(dating,/text-\[clamp\(3rem,12vw,5rem\)\]/);
 assert.match(dating,/snap-x snap-proximity/);
 assert.match(dating,/max-w-full/);
 assert.match(dating,/overflow-x-auto/);
 assert.match(dating,/snap-start whitespace-nowrap/);
 assert.match(dating,/Swipe to see more categories/);
 assert.match(dating,/flex flex-wrap items-end justify-between/);
});

test("account and Tonight pages no longer compound standalone safe area or forced blank height", () => {
 const account=read("src/app/me/page.tsx");
 assert.match(account,/pb-24 pt-6/);
 assert.match(account,/text-\[clamp\(2.5rem,11vw,4rem\)\]/);
 const tonight=read("src/app/tonight/page.tsx");
 assert.match(tonight,/min-h-\[calc\(100dvh-11rem\)\]/);
 assert.match(tonight,/className="flex items-center justify-between px-6 pt-3/);
 const layout=read("src/app/layout.tsx");
 assert.match(layout,/viewportFit: "cover"/);
});
