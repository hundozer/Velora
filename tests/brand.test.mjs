import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the brand reference and agent instructions exist and point to the Logo component", async () => {
  const brand = await read("docs/brand/BRAND.md");
  assert.match(brand, /The overlap/);
  assert.match(brand, /@\/components\/brand\/Logo/);
  assert.match(await read("AGENTS.md"), /docs\/brand\/BRAND\.md/);
  assert.match(await read("CLAUDE.md"), /AGENTS\.md/);
  for (const file of ["intimo-logo-dark.svg", "intimo-logo-light.svg", "intimo-symbol.svg", "intimo-icon-512.png"]) await access(new URL(`../public/brand/${file}`, import.meta.url));
  for (const file of ["favicon.svg", "favicon-32.png", "favicon-16.png"]) await access(new URL(`../public/icons/${file}`, import.meta.url));
});

test("every place that shows the brand uses the Logo component, and the old arrow mark is gone", async () => {
  for (const file of ["src/components/layout/Navbar.tsx", "src/components/layout/Footer.tsx", "src/components/auth/AuthShell.tsx", "src/components/common/AgeVerificationModal.tsx", "src/components/people/MemberPeople.tsx", "src/app/tonight/page.tsx", "src/components/admin/AdminWorkspaceShell.tsx"]) {
    const source = await read(file);
    assert.match(source, /<Logo /, `${file} uses <Logo />`);
    assert.doesNotMatch(source, /intimo<span[^>]*>↗/, `${file} still has the retired arrow wordmark`);
  }
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /\/icons\/favicon\.svg/);
});
