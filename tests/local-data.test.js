import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFile, chunkPages, retrieve, recentMessages, toSrt, wavBlob } from '../src/utils.js';
import { models, mlcRecord } from '../src/catalog.js';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';

test('rejects empty, oversized and unexpected uploaded files', () => {
  assert.throws(() => validateFile({ name: 'notes.pdf', size: 0 }, ['pdf'], 15), /contains some data/);
  assert.throws(() => validateFile({ name: 'notes.pdf.exe', size: 10 }, ['pdf'], 15), /PDF/);
  assert.throws(() => validateFile({ name: 'notes.pdf', size: 16000000 }, ['pdf'], 15), /too large/);
  assert.equal(validateFile({ name: 'NOTES.PDF', size: 100 }, ['pdf'], 15), 'pdf');
});
test('document retrieval preserves page provenance and finds an answer deep in the file', () => {
  const pages = [{ page: 1, text: 'A gardening guide. '.repeat(100) }, { page: 7, text: 'The annual picnic takes place on June 12 at River Park.' }, { page: 8, text: 'The membership fee is thirty dollars.' }];
  const chunks = chunkPages(pages);
  const found = retrieve(chunks, 'Where is the annual picnic?', 1);
  assert.equal(found[0].page, 7); assert.match(found[0].text, /River Park/);
  assert.equal(retrieve(chunks, 'membership fee', 1)[0].page, 8);
});
test('history trimming never starts with an assistant or changes the source', () => {
  const messages = [{ role: 'user', content: 'old' }, { role: 'assistant', content: 'old answer' }, { role: 'user', content: 'new' }, { role: 'assistant', content: 'new answer' }];
  assert.deepEqual(recentMessages(messages, 15), messages.slice(2)); assert.equal(messages.length, 4);
  assert.deepEqual(recentMessages(messages, 5), []);
});
test('subtitle timestamps handle hour boundaries and missing end times', () => {
  assert.equal(toSrt([{ text: ' Hello ', timestamp: [3599.999, 3601.05] }, { text: 'Next', timestamp: [3602, null] }]), '1\n00:59:59,999 --> 01:00:01,050\nHello\n\n2\n01:00:02,000 --> 01:00:04,000\nNext\n');
});
test('downloaded speech is a valid mono PCM WAV with clipped samples', async () => {
  const blob = wavBlob(new Float32Array([-2, 0, 2]), 16000), bytes = await blob.arrayBuffer(), view = new DataView(bytes);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), 'RIFF');
  assert.equal(view.getUint32(24, true), 16000); assert.equal(view.getUint32(40, true), 6);
  assert.equal(view.getInt16(44, true), -32768); assert.equal(view.getInt16(48, true), 32767);
});
test('both precision paths of every GPU model resolve to pinned, supported model records', () => {
  for (const model of models.filter(m => m.runtime === 'mlc')) {
    for (const f16 of [true, false]) {
      const record = mlcRecord(model, f16, prebuiltAppConfig);
      assert.match(record.model, /\/resolve\/[a-f0-9]{40}\/$/);
      assert.equal(record.required_features?.includes('shader-f16') || false, f16);
      assert.match(record.model_lib, /v0_2_86/);
    }
  }
  assert.equal(new Set(models.map(m => m.id)).size, models.length);
  assert.ok(models.every(m => /^[a-f0-9]{40}$/.test(m.revision)));
});
