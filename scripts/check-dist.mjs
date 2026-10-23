import { readdir, stat, readFile } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
let count = 0, largest = 0;
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await check(path);
    else {
      const { size } = await stat(path);
      if (size > 25 * 1024 * 1024) throw new Error(`${entry.name} exceeds Cloudflare's 25 MiB asset limit.`);
      count++; largest = Math.max(largest, size);
    }
  }
}
await check(root);
for (const name of ['index.html', '_headers', 'robots.txt', 'sitemap.xml', 'third-party-licenses.txt']) {
  if (!(await readFile(new URL(name, root), 'utf8')).trim()) throw new Error(`Missing deployment file: ${name}`);
}
console.log(`Checked ${count} static assets. Largest: ${(largest / 1024 / 1024).toFixed(2)} MiB; Cloudflare limit: 25 MiB.`);
