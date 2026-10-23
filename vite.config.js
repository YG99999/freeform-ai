import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const globalHeaders = readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split('/runtime/*')[0];
const previewHeaders = Object.fromEntries([...globalHeaders.matchAll(/^ {2}([^:]+): (.+)$/gm)].map(([, name, value]) => [name, value.trim()]));
const siteUrl = (process.env.SITE_URL || 'https://freeform-local-ai.freeform-ai.workers.dev').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(siteUrl)) throw new Error('SITE_URL must be an HTTPS origin.');
export default defineConfig({
  // Aliases also apply inside Vite's separately compiled inference worker.
  resolve: { alias: [
    { find: /^onnxruntime-web\/webgpu$/, replacement: fileURLToPath(new URL('./node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs', import.meta.url)) },
    { find: /^onnxruntime-web$/, replacement: fileURLToPath(new URL('./node_modules/transformers-legacy/node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs', import.meta.url)) },
  ] },
  plugins: [{
    name: 'freeform-search-metadata',
    transformIndexHtml(html) {
      const schema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Freeform', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', url: siteUrl, description: 'Free, open-source browser-local AI chat, documents, images, transcription, speech, and portrait cutouts.', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, license: 'https://opensource.org/license/mit', codeRepository: 'https://github.com/YG99999/freeform-ai' };
      return html.replace('</head>', `<link rel="canonical" href="${siteUrl}/"><meta property="og:url" content="${siteUrl}/"><script type="application/ld+json">${JSON.stringify(schema)}</script></head>`).replace('content="/social-card.svg"', `content="${siteUrl}/social-card.png"`);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>` });
    },
  }],
  // The specialist pipelines run on WASM. Avoid bundling the unused 28 MB WebGPU
  // ORT binary, which exceeds Cloudflare's per-file limit. MLC/FLUX own their GPU kernels.
  optimizeDeps: { exclude: ['flux-klein.js', 'onnxruntime-web', '@huggingface/transformers', 'transformers-legacy', '@mlc-ai/web-llm'] },
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 2200 },
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' } },
  preview: { headers: previewHeaders }
});
