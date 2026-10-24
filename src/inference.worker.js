import { findModel, mlcRecord } from './catalog.js';
let loaded, engine, hf, speechRuntime, currentId;
const emit = (type, data = {}) => self.postMessage({ id: currentId, type, ...data });
const progress = p => {
  if (p.status === 'progress') emit('progress', { text: `Downloading ${p.file}: ${Math.round(p.progress || 0)}%`, fraction: (p.progress || 0) / 100 });
  else if (p.status === 'initiate') emit('progress', { text: `Preparing ${p.file}…` });
  else if (p.status === 'done') emit('progress', { text: `Saved ${p.file}` });
};
async function transformers() {
  if (!hf) {
    hf = await import('@huggingface/transformers');
    hf.env.allowLocalModels = false;
    hf.env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    hf.env.backends.onnx.wasm.proxy = false;
    hf.env.backends.onnx.wasm.wasmPaths = {
      mjs: new URL('/runtime/transformers/ort-wasm-simd-threaded.mjs', self.location.origin).href,
      wasm: new URL('/runtime/transformers/ort-wasm-simd-threaded.wasm', self.location.origin).href,
    };
  }
  return hf;
}
async function speechTransformers() {
  // SpeechT5's encoder/decoder contract is supported by the stable 3.8 runtime.
  // Keep it isolated from the newer tokenizer/image pipeline instead of patching internals.
  speechRuntime ||= await import('transformers-legacy');
  speechRuntime.env.allowLocalModels = false;
  speechRuntime.env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
  speechRuntime.env.backends.onnx.wasm.wasmPaths = {
    mjs: `${self.location.origin}/runtime/speech/ort-wasm-simd-threaded.mjs`,
    wasm: `${self.location.origin}/runtime/speech/ort-wasm-simd-threaded.wasm`,
  };
  return speechRuntime;
}
async function load(model, f16) {
  if (loaded === model.id) return;
  emit('progress', { text: `Loading ${model.name}. The first visit takes longer…` });
  if (model.runtime === 'mlc') {
    const mlc = await import('@mlc-ai/web-llm');
    const record = mlcRecord(model, f16, mlc.prebuiltAppConfig);
    engine = await mlc.CreateMLCEngine(record.model_id, {
      appConfig: { model_list: [record], useIndexedDBCache: false },
      initProgressCallback: p => emit('progress', { text: p.text, fraction: p.progress }),
    });
  } else if (model.runtime === 'flux') {
    const { createFluxKlein, formatProgress, progressFraction } = await import('flux-klein.js');
    const base = `https://huggingface.co/${model.repo}/resolve/${model.revision}`;
    engine = await createFluxKlein({
      mode: 'mobile', base, tokenizerUrl: `${base}/tokenizer`, decoder: 'tiny',
      cacheDir: 'freeform-images-v1', oneThing: true,
      wasmPaths: `${self.location.origin}/runtime/ort/`,
      ortUrl: `${self.location.origin}/runtime/ort/ort.wasm.min.mjs`,
      threads: self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1,
      onEvent: ev => emit('progress', { text: formatProgress(ev), fraction: progressFraction(ev) }),
    });
  } else {
    const { pipeline, AutoModel } = model.task === 'speech' ? await speechTransformers() : await transformers();
    const task = { text: 'text-generation', transcribe: 'automatic-speech-recognition', speech: 'text-to-speech', cutout: 'background-removal' }[model.task];
    engine = await pipeline(task, model.repo, { revision: model.revision, dtype: 'q8', device: 'wasm', progress_callback: progress });
    if (model.task === 'speech') {
      engine.vocoder = await AutoModel.from_pretrained('Xenova/speecht5_hifigan', { revision: 'cf980c3610d7b7f20919960031066ef7905737bd', dtype: 'q8', device: 'wasm', progress_callback: progress });
    }
  }
  loaded = model.id;
  emit('loaded', { model: model.id });
}
self.onmessage = async ({ data: job }) => {
  currentId = job.id;
  try {
    const model = findModel(job.model);
    if (!model) throw new Error('Choose a model from the catalog.');
    await load(model, job.f16);
    emit('progress', { text: job.task === 'transcribe' ? 'Listening to your recording. Longer clips take longer…' : 'Working on your device…' });
    if (job.task === 'chat' || job.task === 'documents') {
      if (!Array.isArray(job.messages) || job.messages.length > 40) throw new Error('Please start a new conversation.');
      if (model.runtime === 'mlc') {
        // WebLLM implements this Qwen option by inserting <think> prompt markers.
        // Other families, including SmolLM2, must receive their normal template.
        const stream = await engine.chat.completions.create({ messages: job.messages, stream: true, temperature: 0.65, max_tokens: 650, ...(model.id.startsWith('qwen-') ? { extra_body: { enable_thinking: false } } : {}) });
        let text = '';
        for await (const part of stream) {
          const token = part.choices[0]?.delta?.content || ''; text += token;
          if (token) emit('token', { text });
        }
        emit('done', { text });
      } else {
        const { TextStreamer } = await transformers();
        let text = '';
        const streamer = new TextStreamer(engine.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: token => { text += token; emit('token', { text }); } });
        const result = await engine(job.messages, { max_new_tokens: 420, do_sample: true, temperature: 0.65, repetition_penalty: 1.1, streamer });
        emit('done', { text: text || result[0]?.generated_text?.at(-1)?.content || '' });
      }
    } else if (job.task === 'transcribe') {
      const result = await engine(job.samples, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true, task: 'transcribe', ...(job.language ? { language: job.language } : {}) });
      emit('done', { text: result.text, chunks: result.chunks || [] });
    } else if (job.task === 'speech') {
      const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/542437c29cc5273cfd29e25c77696f2b349badd7/speaker_embeddings.bin';
      const cache = await caches.open('freeform-support-v1');
      let response = await cache.match(url);
      if (!response) { response = await fetch(url); if (!response.ok) throw new Error(`Speaker download HTTP ${response.status}`); await cache.put(url, response.clone()); }
      const speaker_embeddings = new Float32Array(await response.arrayBuffer());
      // SpeechT5 has a short input window. Split explicitly rather than silently truncate.
      const parts = job.text.match(/[^.!?]+[.!?]?/g) || [job.text], segments = [];
      for (const part of parts) for (let p = 0; p < part.length; p += 240) segments.push(part.slice(p, p + 240));
      const audio = []; let rate = 16000;
      for (let i = 0; i < segments.length; i++) {
        emit('progress', { text: `Reading passage ${i + 1} of ${segments.length}…`, fraction: i / segments.length });
        const result = await engine(segments[i].trim(), { speaker_embeddings });
        audio.push(result.audio); rate = result.sampling_rate;
      }
      const samples = new Float32Array(audio.reduce((s, a) => s + a.length + Math.round(rate * .15), 0));
      let offset = 0; for (const a of audio) { samples.set(a, offset); offset += a.length + Math.round(rate * .15); }
      emit('done', { samples, sampleRate: rate });
    } else if (job.task === 'cutout') {
      const { RawImage } = await transformers();
      const input = await RawImage.fromBlob(job.blob);
      const result = await engine(input);
      emit('done', { blob: await result.toBlob('image/png') });
    } else if (job.task === 'image') {
      const { toImageData } = await import('flux-klein.js');
      const result = await engine.generate({ prompt: job.text, width: job.size, height: job.size, steps: job.steps, seed: job.seed });
      const canvas = new OffscreenCanvas(result.width, result.height);
      canvas.getContext('2d').putImageData(toImageData(result), 0, 0);
      emit('done', { blob: await canvas.convertToBlob({ type: 'image/png' }), seed: result.seed });
    }
  } catch (error) { emit('error', { message: error?.message || String(error) }); }
};
