# Third-party notices

The website's own source is MIT. Model weights are downloaded directly from their publishers and retain their separate licenses; see [the model catalog](docs/MODELS.md).

The browser bundle uses the following projects. Their licenses and copyright notices are included in the deployed `/third-party-licenses.txt`, generated from the locked dependency packages. The package lock records exact versions and integrity hashes.

| Project | License | Source |
| --- | --- | --- |
| Transformers.js, Hugging Face Tokenizers | Apache-2.0 | https://github.com/huggingface/transformers.js ; https://github.com/huggingface/tokenizers.js |
| Hugging Face Jinja | MIT | https://github.com/huggingface/huggingface.js |
| WebLLM, included TVM runtime | Apache-2.0 | https://github.com/mlc-ai/web-llm |
| ONNX Runtime Web / Common and CPU WASM | MIT | https://github.com/microsoft/onnxruntime |
| flux-klein.js | MIT | Locked npm source: https://www.npmjs.com/package/flux-klein.js/v/0.7.0 |
| DOMPurify | Apache-2.0 option | https://github.com/cure53/DOMPurify |
| Marked | MIT | https://github.com/markedjs/marked |
| Mammoth | BSD-2-Clause | https://github.com/mwilliamson/mammoth.js |
| PDF.js | Apache-2.0 | https://github.com/mozilla/pdf.js |
| JSZip | MIT option | https://github.com/Stuk/jszip |
| Underscore and other Mammoth runtime dependencies | MIT / BSD | See locked dependency notices |
| Bricolage Grotesque and DM Sans font files | SIL OFL-1.1 | Fontsource packages include the original font copyright notices |
| Vite / Rolldown module helpers | MIT | https://github.com/vitejs/vite ; https://github.com/rolldown/rolldown |

Freeform wraps the public APIs; it does not copy the Bonsai demo or claim ownership of model work. The original mockup in `design/` is historical design material and is not deployed.
