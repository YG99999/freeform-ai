import { models, mlcRecord } from '../src/catalog.js';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
let failures = 0;
for (const model of models) {
  const paths = model.runtime === 'mlc' ? [true, false].map(f16 => {
    const record = mlcRecord(model, f16, prebuiltAppConfig);
    return [record.model + 'mlc-chat-config.json', record.model_lib];
  }).flat() : [`https://huggingface.co/${model.repo}/resolve/${model.revision}/${model.runtime === 'flux' ? 'web_weights_mobile/manifest.json' : 'config.json'}`];
  for (const url of [...new Set(paths)]) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) { failures++; console.error(`${model.id}: ${error.message} (${url})`); }
  }
  console.log(`${model.id}: checked published config/runtime locations`);
}
process.exitCode = failures ? 1 : 0;
