import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
const root = process.cwd();
const patterns = {
  legacyUtility: /\b(?:velora|intimo)-(?:goldHover|gold|borderGold|amber|roseGold|copperInk|copperLight|copper)\b/g,
  legacyEffect: /\b(?:glass-panel(?:-gold)?|gold-gradient(?:-text)?|gold-radial|gold-glow|gold-border-glow)\b/g,
  legacyColor: /#(?:d4af37|f3e5ab)\b|rgba?\(\s*212\s*[, ]\s*175\s*[, ]\s*55\b/gi,
  legacyVariable: /--(?:gold|copper(?:-ink|-light)?|rose-gold|border-gold)\b/g,
};
const findings = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (entry.isFile() && /\.(?:tsx?|jsx?|mjs|cjs|css|scss|html|svg|json)$/i.test(path)) {
      const source = await readFile(path, "utf8");
      source.split(/\r?\n/).forEach((line, index) => {
        for (const [kind, regex] of Object.entries(patterns)) {
          for (const match of line.matchAll(regex)) findings.push({ file: relative(root,path), line: index+1, kind, value: match[0] });
        }
      });
    }
  }
}
for (const dir of ["src", "public"]) await scan(join(root,dir));
console.log(JSON.stringify({ filesWithFindings: new Set(findings.map(x => x.file)).size, findings }, null, 2));
if (process.argv.includes("--strict") && findings.length) process.exitCode = 1;
