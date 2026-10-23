import { cp, mkdir, copyFile } from 'node:fs/promises';
// Only CPU ORT is needed: WebLLM and FLUX supply their own WebGPU kernels.
// The plain WASM binary is under Cloudflare's 25 MiB per-asset limit.
const target = new URL('../public/runtime/ort/', import.meta.url);
await mkdir(target, { recursive: true });
for (const name of ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(new URL(`../node_modules/onnxruntime-web/dist/${name}`, import.meta.url), new URL(name, target));
}
// Transformers ships a slightly newer matching ORT build; keep its CPU pair separate.
const hf = new URL('../public/runtime/transformers/', import.meta.url);
await mkdir(hf, { recursive: true });
for (const name of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(new URL(`../node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/${name}`, import.meta.url), new URL(name, hf));
}
for (const dir of ['cmaps', 'standard_fonts']) {
  await cp(new URL(`../node_modules/pdfjs-dist/${dir}/`, import.meta.url), new URL(`../public/runtime/pdf/${dir}/`, import.meta.url), { recursive: true });
}
const legacy = new URL('../public/runtime/speech/', import.meta.url);
await mkdir(legacy, { recursive: true });
for (const name of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(new URL(`../node_modules/transformers-legacy/node_modules/onnxruntime-web/dist/${name}`, import.meta.url), new URL(name, legacy));
}
// Browser distributions contain module-relative URLs for every ORT backend, even unused
// GPU/asyncify backends. Build replacement in vite.config.js prevents emitting those.
console.log('Prepared matching, self-hosted CPU runtimes.');
