export function validateFile(file, extensions, maxMB) {
  if (!file || !file.size) throw new Error('Choose a file that contains some data.');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!extensions.includes(extension)) throw new Error(`Please choose ${extensions.map(x => x.toUpperCase()).join(', ')}.`);
  if (file.size > maxMB * 1e6) throw new Error(`This file is too large. The limit is ${maxMB} MB.`);
  return extension;
}
export function chunkPages(pages, size = 700) {
  const chunks = [];
  for (const page of pages) {
    const text = page.text.replace(/\s+/g, ' ').trim();
    for (let start = 0; start < text.length; start += size - 100) {
      chunks.push({ page: page.page, text: text.slice(start, start + size) });
      if (start + size >= text.length) break;
    }
  }
  return chunks;
}
const words = s => s.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
export function retrieve(chunks, question, count = 3) {
  const terms = [...new Set(words(question))];
  return chunks.map((chunk, index) => {
    const tokens = words(chunk.text);
    const score = terms.reduce((sum, t) => sum + Math.min(tokens.filter(w => w === t).length, 4), 0) / Math.sqrt(Math.max(1, tokens.length));
    return { ...chunk, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, count);
}
export function recentMessages(messages, budget = 5600) {
  const result = []; let length = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (length + m.content.length > budget) break;
    result.unshift({ role: m.role, content: m.content }); length += m.content.length;
  }
  while (result.length && result[0].role !== 'user') result.shift();
  return result;
}
export function toSrt(chunks) {
  const stamp = s => {
    const ms = Math.max(0, Math.round((s || 0) * 1000));
    return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  return chunks.map((c, i) => `${i + 1}\n${stamp(c.timestamp[0])} --> ${stamp(c.timestamp[1] ?? c.timestamp[0] + 2)}\n${c.text.trim()}\n`).join('\n');
}
export function wavBlob(samples, sampleRate = 24000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buffer);
  const write = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  write(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); write(8, 'WAVE'); write(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); write(36, 'data'); v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * (s < 0 ? 32768 : 32767), true));
  return new Blob([buffer], { type: 'audio/wav' });
}
export function friendlyError(error) {
  const s = String(error?.message || error);
  if (/password|encrypted/i.test(s)) return 'This document is protected. Export an unprotected copy and try again.';
  if (/context.*(exceed|limit|length)|prompt.*too long/i.test(s)) return 'This conversation is too long for the model. Start a new chat or ask a shorter question.';
  if (/quota|disk|storage/i.test(s)) return 'Your browser ran out of storage. Remove saved models in Downloads, or free up space and try again.';
  if (/out of memory|allocat|memory access|buffer.*limit|device.*lost|GPU.*lost/i.test(s)) return 'This device ran out of working memory. Try a smaller model, close other tabs, or reload the page.';
  if (/fetch|network|HTTP|429|failed to load|status: 4|status: 5/i.test(s)) return 'The download could not finish. Check your connection and try again. Hugging Face may also be temporarily busy or rate limiting downloads.';
  if (/WebGPU|adapter|shader|GPUDevice/i.test(s)) return 'The graphics runtime could not start. Try an updated Chrome or Edge with graphics acceleration enabled, or choose the CPU text model.';
  return s.slice(0, 700) || 'Something went wrong. Please try again.';
}
