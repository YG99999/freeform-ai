// Sizes are approximate first downloads, not memory requirements or benchmarks.
// All model downloads are direct from the publisher, after the visitor consents.
const mlc = (id, name, size, memory, revision16, revision32, description) => ({
  id, name, size, memory, description, runtime: 'mlc', task: 'text', license: 'Apache-2.0',
  repo: `mlc-ai/${name}-q4f16_1-MLC`, revision: revision16, revision32,
});
export const models = [
  { id: 'smol-cpu', name: 'SmolLM2 135M', task: 'text', runtime: 'transformers', repo: 'HuggingFaceTB/SmolLM2-135M-Instruct', revision: '12fd25f77366fa6b3b4b768ec3050bf629380bac', size: 140, memory: 'Allow about 600 MB of RAM', license: 'Apache-2.0', description: 'CPU fallback. Basic English writing; limited reasoning and factual accuracy.' },
  { id: 'smol', name: 'SmolLM2-360M-Instruct', task: 'text', runtime: 'mlc', repo: 'mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC', revision: '3a622fd89e0216e8bb10c410c007c786baa8a033', revision32: '1e6b2ca3684e2bc8a6d39eb36e8d6cd51eb12bda', size: 210, memory: 'About 0.4–0.6 GB GPU memory, plus overhead', license: 'Apache-2.0', description: 'The smallest GPU choice. Quick English drafts and simple questions.' },
  mlc('qwen-small', 'Qwen3.5-0.8B', 450, 'About 1.6–1.9 GB GPU memory, plus overhead', '0ec138972555613c1d7812a821778ad0398c8790', '4ed017713f04c91ffe55a9dca8c7ac853c41314d', 'Small multilingual assistant. A modest step up from the smallest model.'),
  mlc('qwen-medium', 'Qwen3.5-2B', 1100, 'About 2.2–2.6 GB GPU memory, plus overhead', 'dd74e9c8a20c4546df85c844103bff87b6dcacad', 'd835e5c41aa56174d915e8a3940cde599d3f5a30', 'A useful middle ground for writing, questions, and document excerpts.'),
  mlc('qwen-large', 'Qwen3.5-4B', 2400, 'About 3.9–4.7 GB GPU memory, plus overhead', '44b42469f9e192814bfd90440e3b377d89ba7a13', 'ce39652c7b493d59331e40ef9c7a87de5a47abe3', 'More capable writing and reasoning. Needs a stronger device.'),
  mlc('qwen-max', 'Qwen3.5-9B', 5100, 'About 6.4–7.6 GB GPU memory, plus overhead', 'c7c5d3f5a81e37b8facbb72970940a1b131314a8', 'f8f042bfb68cb88573af4c8e0ef9b1a26bef4ad0', 'The largest text option here. For desktops with plenty of GPU memory.'),
  ...[
    ['tiny', 45, 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7', 'Small download. Best with clear speech and short recordings.'],
    ['base', 80, '1846881b6b3a3024392c1eea3ad983695bc23925', 'A larger speech recognizer for a little more accuracy.'],
    ['small', 255, '36050c46d777d46dc4b5f43f6d90574fc38f8732', 'More capable, but noticeably slower on a CPU.'],
  ].map(([s, size, revision, description]) => ({ id: `whisper-${s}`, name: `Whisper ${s}`, task: 'transcribe', runtime: 'transformers', repo: `onnx-community/whisper-${s}`, revision, size, license: 'MIT', memory: 'Several times the download size in working RAM', description })),
  { id: 'speecht5', name: 'SpeechT5', task: 'speech', runtime: 'transformers', repo: 'Xenova/speecht5_tts', revision: '1723781b8ce2d02f0400c8337be04ae8ee3d6d56', size: 190, memory: 'Allow about 1 GB of RAM', license: 'MIT', description: 'English text to downloadable speech. One preset voice, running on your CPU.' },
  { id: 'modnet', name: 'MODNet', task: 'cutout', runtime: 'transformers', repo: 'Xenova/modnet', revision: 'fa2fa546052fba4c08921230a26cc69a333fca12', size: 7, memory: 'Allow about 300 MB of RAM', license: 'Apache-2.0', description: 'Removes backgrounds from portraits of people. Not an all-purpose object cutout.' },
  { id: 'flux', name: 'FLUX.2 Klein 4B', task: 'image', runtime: 'flux', repo: 'radames/flux2-klein-edge-web', revision: 'e8f306c29bae4ea18a4d81a3d79507d91e05e94f', size: 3150, memory: 'Publisher estimates: ~0.6 GB GPU + ~1 GB transient CPU; allow extra headroom', license: 'Apache-2.0', description: 'Experimental. Streamed 4-bit image generation. Requires WebGPU and at least 4 GB free browser storage.' },
];
export const findModel = id => models.find(m => m.id === id);
export const modelTasks = task => models.filter(m => m.task === (task === 'documents' || task === 'chat' ? 'text' : task));
export function defaultModel(task, gpu) {
  if (task === 'chat') return gpu ? 'smol' : 'smol-cpu';
  if (task === 'documents') return gpu ? 'qwen-medium' : 'smol-cpu';
  return { image: 'flux', transcribe: 'whisper-tiny', speech: 'speecht5', cutout: 'modnet' }[task];
}
export const downloadSize = mb => mb >= 1000 ? `${(Math.ceil(mb / 100) / 10).toFixed(1)} GB` : `${mb} MB`;
export function mlcRecord(model, f16, config) {
  const suffix = f16 ? 'q4f16_1' : 'q4f32_1';
  const id = `${model.name}-${suffix}-MLC`;
  const original = config.model_list.find(m => m.model_id === id);
  if (!original) throw new Error('This model is not supported by the installed runtime. Choose another model.');
  return { ...original, required_features: f16 ? ['shader-f16'] : [], model: `${original.model}/resolve/${f16 ? model.revision : model.revision32}/`, overrides: { ...original.overrides, context_window_size: 4096 } };
}
