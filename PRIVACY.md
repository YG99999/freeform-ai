# Privacy and network behavior

Freeform has no accounts, advertising, analytics, tracking cookies, paid inference calls, or prompt/file upload endpoint.

## What stays in the browser

Chat messages, uploaded documents, extracted text, uploaded audio, portraits, and generated results are processed on the visitor's device. They are held in this tab's memory and disappear when it reloads or closes. Copy or download results to keep them. Downloads you save are ordinary files on your device and are not removed by the site.

Model weights, tokenizer data, and compiled runtime assets are cached. The site uses CacheStorage for Transformers.js and WebLLM, and a dedicated `freeform-images-v1` OPFS directory for image weights. Browser storage estimates include other data used by the app. “Remove saved models” stops the active model and removes these caches and this image directory; it does not delete your personal downloaded result files.

## What uses the network

| Destination | Reason | Information visible to provider |
| --- | --- | --- |
| Cloudflare / the site's host | HTML, CSS, JS, fonts, model runtime files | Ordinary web request information, such as IP address and browser headers |
| Hugging Face and its model delivery hosts | Model weights, model config, tokenizer files, preset speech embedding | Ordinary download information; selected public model URL |
| raw.githubusercontent.com (MLC) | Compiled GPU model library | Ordinary download information; selected compiled library URL |
| GitHub / Hugging Face links | Only when a visitor opens a source/model link | Ordinary information associated with that visit |

Model requests do not contain your prompt, document, photo, or recording. Providers can log connection metadata according to their own policies. A private inference flow is not an anonymous browsing service.

The site sets a no-referrer policy. Model-generated text is rendered without outbound links, images, embeds, or scripts. There is no upload fallback if local inference fails. Private or gated model tokens are not requested or embedded.

## Storage and reliability

The browser may evict cached models, deny persistence, or run out of memory. An optional persistence request asks the browser to retain downloads; it does not override the user's browser controls. Private browsing and storage-clearing tools may erase downloads. A separate deployment origin has a separate cache.

This release requires a connection to load the app page; it does not promise a fully offline installation. Cached model files can often be reused without another weight download. An interrupted download may leave reusable partial files. Use Downloads to remove them if necessary.

Do not use shared browser profiles for sensitive documents. Other software, extensions, and the device owner may be able to access local content. Public GitHub issues are public: do not include private prompts or files in them.
