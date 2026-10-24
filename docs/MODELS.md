# Model catalog and research

Research checked against publisher repositories and the locked runtime packages on October 23, 2026. This is a compatibility catalog, not a benchmark leaderboard. Model revisions are pinned in `src/catalog.js`.

| Model | Approximate first download | Purpose and tradeoff | Upstream license |
| --- | ---: | --- | --- |
| [SmolLM2 135M](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct) | 140 MB + runtime | CPU fallback, basic English; weak reasoning | Apache-2.0 |
| [SmolLM2 360M MLC](https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC) | 210 MB + compiled library | Small GPU model for simple writing | Apache-2.0 |
| [Qwen3.5 0.8B MLC](https://huggingface.co/mlc-ai/Qwen3.5-0.8B-q4f16_1-MLC) | 450 MB + library | Small multilingual text option | Apache-2.0 |
| [Qwen3.5 2B MLC](https://huggingface.co/mlc-ai/Qwen3.5-2B-q4f16_1-MLC) | 1.1 GB + library | Middle-sized text/document assistant | Apache-2.0 |
| [Qwen3.5 4B MLC](https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f16_1-MLC) | 2.4 GB + library | Larger text model; more GPU memory | Apache-2.0 |
| [Qwen3.5 9B MLC](https://huggingface.co/mlc-ai/Qwen3.5-9B-q4f16_1-MLC) | 5.1 GB + library | Largest text choice; high memory requirement | Apache-2.0 |
| [Whisper tiny](https://huggingface.co/onnx-community/whisper-tiny), [base](https://huggingface.co/onnx-community/whisper-base), [small](https://huggingface.co/onnx-community/whisper-small) | ~45 / 80 / 255 MB | Multilingual transcription; CPU q8 encoder/merged decoder | [MIT](https://github.com/openai/whisper/blob/main/LICENSE) |
| [SpeechT5](https://huggingface.co/Xenova/speecht5_tts) + [HiFi-GAN](https://huggingface.co/Xenova/speecht5_hifigan) | ~190 MB | English speech; one public preset speaker embedding | [MIT](https://huggingface.co/microsoft/speecht5_tts/blob/main/README.md) |
| [MODNet](https://huggingface.co/Xenova/modnet) | ~7 MB | Portrait background removal; CPU q8 | [Apache-2.0](https://github.com/ZHKKKe/MODNet/blob/master/LICENSE) |
| [FLUX.2 Klein 4B browser export](https://huggingface.co/radames/flux2-klein-edge-web) | ~3.15 GB | Experimental streamed int4 image generation; tiny decoder | [Apache-2.0 upstream 4B weights](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/blob/main/LICENSE.md) |

Sizes cover selected pipeline files, not every variant in the model repository. Caches, precision variants, runtime files, browser overhead, and provider updates affect actual transfer and disk use. WebLLM selects q4f16 when `shader-f16` is available, otherwise q4f32. Both use pinned model repositories and versioned compiled binaries from WebLLM 0.2.86. The small CPU model uses q8; download size is different from resident working memory.

SpeechT5 uses the separately pinned Transformers.js 3.8.1 runtime. Its older encoder/decoder contract failed inference under 4.3.1, so it is isolated with its matching CPU WASM build. Other specialist pipelines and the image tokenizer use 4.3.1. This avoids patching third-party model internals.

## Memory and quality

WebLLM's published configuration estimates approximately 0.4–0.6 GB for SmolLM2 360M, 1.6–1.9 GB for Qwen 0.8B, 2.2–2.6 GB for 2B, 3.9–4.7 GB for 4B, and 6.4–7.6 GB for 9B. These are library estimates, not measurements of free memory or guarantees. GPU buffers, compiled kernels, context, browser processes, and the operating system require additional resources. Shared-memory GPUs and mobile tab limits complicate the picture further.

“Quick & light”, “Balanced”, and “More capable” describe intended relative positioning. They are not measured quality scores. Performance varies by task, language, hardware, runtime, and quantization. The app makes no best-in-class claim.

Qwen3.5 2B is the suggested GPU default for chat and documents after practical writing, arithmetic, and grounding spot-checks. Smaller options remain available for tighter hardware limits. See [the exact quality prompts and outputs](TEXT-QUALITY.md).

## Why not any Hugging Face repository?

A browser needs a supported architecture, correctly exported weights, tokenizer/processor, compatible kernels, manageable downloads, and enough memory. PyTorch/safetensors checkpoints do not become browser-compatible merely by entering a repository name. Large context, long audio, video generation, high-resolution diffusion, and arbitrary custom Python models are outside this release. No remote custom code is executed.

## Image implementation

The pinned `flux-klein.js@0.7.0` npm package includes readable MIT source, GPU kernels, OPFS caching, and throw-away CPU ONNX workers. Its mobile pipeline streams int4 shards on desktop as well as mobile. The publisher estimates ~0.6 GB GPU plus ~1 GB transient CPU memory, with extra headroom required. Freeform uses the tiny decoder, 256/512 square output, and 2/4 steps. Prompt encoding is capped at 128 tokens. Generation is explicitly experimental.

The converted repository's license metadata says `other`; the actual upstream **4B** model license is Apache-2.0. Do not generalize that to other FLUX models. The package's linked GitHub repository was unavailable during research; its complete npm source is locked in `package-lock.json`. This is a maintenance risk, so upgrades need source review and real-device tests.

Bonsai was not selected: its public demo shipped only a minified bundle with no clearly reusable source license/API. [The author describes its source status here](https://huggingface.co/spaces/webml-community/bonsai-image-webgpu/discussions/7). Janus-Pro was considered, but its MIT metadata conflicts with upstream language applying the DeepSeek Model License. We avoided that ambiguity. Full Stable Diffusion/FLUX desktop checkpoints are not generic browser downloads.

## Primary references

- [WebLLM usage](https://webllm.mlc.ai/docs/user/basic_usage.html) and [published model configuration](https://github.com/mlc-ai/web-llm/blob/v0.2.86/src/config.ts)
- [Transformers.js browser pipeline documentation](https://huggingface.co/docs/transformers.js/api/pipelines)
- [ONNX Runtime Web deployments](https://onnxruntime.ai/docs/tutorials/web/deploy.html)
- [Cloudflare static asset billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [WebGPU availability and secure context requirements](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Hugging Face rate limits](https://huggingface.co/docs/hub/rate-limits)
