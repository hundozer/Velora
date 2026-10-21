import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(\d+) (\d+) (\d+);/g)]
  .map(([, name, ...channels]) => [name, channels.map(Number)]));
const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const blend = (a, b, alpha) => a.map((v, i) => v * alpha + b[i] * (1 - alpha));

for (const background of ['paper', 'surface', 'sunken']) {
  test(`normal and status text meet WCAG AA on ${background}`, () => {
    for (const foreground of ['ink', 'ink-2', 'muted', 'accent', 'danger', 'success', 'warning', 'signal']) {
      assert.ok(ratio(tokens[foreground], tokens[background]) >= 4.5, `${foreground} on ${background}`);
    }
    for (const status of ['danger', 'success', 'warning']) {
      assert.ok(ratio(tokens[status], blend(tokens[status], tokens[background], .1)) >= 4.5, `${status} alert text`);
    }
  });
}
test('primary actions, poster copy and focus indicators remain readable', () => {
  for (const fill of ['accent', 'accent-hover', 'danger', 'success', 'warning']) {
    assert.ok(ratio(tokens.paper, tokens[fill]) >= 4.5, `action text on ${fill}`);
  }
  assert.ok(ratio(tokens.control, tokens.surface) >= 3, 'form boundary');
  assert.ok(ratio(tokens.accent, tokens.surface) >= 3, 'keyboard focus');
});

test('photo overlay text remains light on the dark scrim', () => {
  assert.ok(ratio(tokens['on-photo'], tokens.night) >= 4.5);
});
