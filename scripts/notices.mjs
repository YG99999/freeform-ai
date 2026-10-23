import { readdir, readFile, writeFile } from 'node:fs/promises';
// Include the full production dependency license notices, even for packages that
// are tree-shaken out. This is intentionally conservative about attribution.
const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
let output = 'Freeform third-party license notices\nWebsite source: https://github.com/YG99999/freeform-ai\nModel licenses: https://github.com/YG99999/freeform-ai/blob/main/docs/MODELS.md\n\n';
for (const [location, record] of Object.entries(lock.packages)) {
  if (!location || record.dev) continue;
  const path = new URL(`../${location}/`, import.meta.url);
  let pkg, files;
  try {
    pkg = JSON.parse(await readFile(new URL('package.json', path), 'utf8'));
    files = (await readdir(path)).filter(name => /^(license|notice|copying)(\.|$|-)/i.test(name));
  } catch { continue; } // Optional packages for other operating systems are absent.
  output += `\n${'='.repeat(72)}\n${pkg.name}@${pkg.version}\nLicense: ${pkg.license || 'See source notice'}\n`;
  for (const file of files) {
    try { output += `\n${file}\n${await readFile(new URL(file, path), 'utf8')}\n`; } catch { /* Some packages use a directory named licenses. */ }
  }
}
const ortLicense = await readFile(new URL('../licenses/ONNX-RUNTIME-LICENSE', import.meta.url), 'utf8');
output += `\nONNX Runtime (all bundled versions)\n${ortLicense}`;
await writeFile(new URL('../public/third-party-licenses.txt', import.meta.url), output);
console.log('Prepared third-party copyright and license notices.');
