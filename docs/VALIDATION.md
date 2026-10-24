# Release validation

Validated on October 23, 2026, on Windows with Intel Iris Xe integrated graphics in the Chromium-based Codex browser. These are functional checks on one device, not comparative benchmarks or certification of every browser and GPU.

## Automated checks

- `npm test`: six tests passed for rejected empty/oversized/unexpected files, document retrieval and page provenance, conversation trimming, SRT timestamps, PCM WAV output, and both precision paths of every GPU catalog entry.
- `npm run check:models`: all 12 catalog entries passed checks of pinned configuration and compiled runtime URLs. This verifies published locations; it does not execute every model.
- `npm run build`: passed. The static output has 228 files; the largest is 13.60 MiB, below Cloudflare's 25 MiB per-asset limit. The build now enforces this limit.
- `npm audit --audit-level=high`: zero reported vulnerabilities at validation time, including development dependencies.

## Actual browser inference

| Flow | Observed result |
| --- | --- |
| CPU chat: SmolLM2 135M, q8 WASM | Generated and streamed a real response. |
| GPU chat: SmolLM2 360M, q4f16 | Generated a real response on the integrated GPU. |
| GPU chat: Qwen3.5 0.8B, q4f16 | Downloaded, loaded, and streamed a response on the public Cloudflare URL. A factual answer was inaccurate; successful inference is not a quality guarantee. |
| Default document assistant: Qwen3.5 2B, q4f16 | Downloaded and answered a PDF question on the public URL: “The garden club annual picnic is on June 12 at River Park [1].” Both facts and the citation matched the supplied page. |
| Documents | Read a synthetic PDF (103 characters) and DOCX (207 characters). A document question returned the source date/location with visible excerpts. The smallest model also added unsupported details, reinforcing the need to check excerpts. PDF reading also passed on the public URL under its security policy. |
| Whisper tiny, q8 WASM | Transcribed a seven-second synthetic recording correctly: “Freeform runs on your own device. There are no accounts and no subscriptions.” Public-site inference also passed; the downloaded SRT contained a valid timestamp range and transcript. |
| SpeechT5, q8 WASM | Generated a playable 3.628-second English WAV. Downloaded output had RIFF/WAVE headers, 16 kHz mono PCM, and nonzero samples. The successful run took about seven seconds including preparation with cached weights. A second run passed under production-equivalent security headers. |
| MODNet, q8 WASM | Read a portrait and produced a visible transparent-background PNG. |
| FLUX.2 Klein 4B, mobile/int4 pipeline | Produced and exported a real 256 × 256 PNG with two steps on the integrated GPU. The first red-teapot test took about 191 seconds including download/preparation. A second star/bookshop image took about 40 seconds with cached weights under the same CSP/COOP/COEP headers as production. See the [actual application screenshot](images/image-example.png). |

The first SpeechT5 attempt failed under Transformers.js 4.3.1. The release isolates it on pinned 3.8.1 with matching WASM; the corrected flow passed. Other pipelines remain on 4.3.1.

Times include different cache/network states and are observations from this device only. The image test used 256px/two steps; 512px/four-step output has not been benchmarked. Whisper base/small and Qwen 4B/9B have configuration checks but have not been executed on this device. The f32 GPU fallback is configured and checked, but actual GPU tests used f16.

## Application and deployment checks

- Task-specific conversation, document input, audio input, speech input, portrait input, and image options appeared correctly.
- A document question without a file showed a recoverable error before any model download.
- Stop interrupted public-site generation, marked the partial reply, and restored enabled controls.
- Downloads displayed 25 cached test files. Removing saved models changed the count to zero and displayed its completion message. Reported disk usage can lag cache removal.
- The refined phone layout was inspected at 350 × 844 and 350 × 480: a native selector exposes all six tools, the compact model chooser remains accessible, and the send action fits within the short viewport. Desktop layout uses a tool rail and one workspace. Desktop layout was also inspected. This is viewport testing, not a physical-phone inference test.
- Cloudflare served HTTP 200 with CSP, COOP `same-origin`, COEP `credentialless`, no-referrer, and feature restrictions. GPU inference, CPU transcription, and PDF extraction worked on the public origin without browser console errors.
- Canonical URL, Open Graph image, SoftwareApplication structured data, `robots.txt`, and sitemap are emitted. These make the site ready for indexing; they do not guarantee search placement.

## Remaining practical limits

No physical iOS/Android, Safari, Firefox, low-memory Chromebook, or discrete high-memory GPU was available for validation. Free GPU memory cannot be measured reliably from a web page. Large downloads, browser eviction, model accuracy, supported codecs, drivers, thermal limits, and provider rate limits still apply. The app has no account, inference backend, cloud fallback, or offline installation service worker.

## Frontend refinement and text quality pass

The app now has a compact model chooser, an auto-growing chat input with Enter/Shift+Enter behavior, a conversation that preserves reading position during streaming, per-tool drafts/options, file previews and replacement, and browser Back navigation. Repeated marketing/explanatory copy was removed; download size and memory facts remain at model decisions.

Browser checks exercised download cancellation with the draft retained, a real streamed GPU reply, real Whisper tiny transcription and result controls, PDF reading, invalid portrait-file replacement retaining the existing selection, image options restored after Back, and the 350 × 480 composer position (send action bottom: 447px; no horizontal or vertical page overflow). Device support, privacy, and source remain reachable from Help on phones.

The quality pass found a Qwen-only prompt option being applied to SmolLM2; it is now restricted to Qwen. The small models still make substantial errors with corrected prompts. [Exact samples and interpretation](TEXT-QUALITY.md) document the recommendation of Qwen3.5 2B as the GPU default. This is a small manual check, not a benchmark or accuracy guarantee.
