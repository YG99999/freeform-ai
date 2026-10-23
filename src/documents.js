import { validateFile, chunkPages } from './utils.js';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
const MAX_TEXT = 180000;
export async function readDocument(file, report = () => {}) {
  const ext = validateFile(file, ['txt', 'md', 'pdf', 'docx'], 15);
  let pages = [], note = '';
  if (ext === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, useSystemFonts: true, cMapUrl: '/runtime/pdf/cmaps/', cMapPacked: true, standardFontDataUrl: '/runtime/pdf/standard_fonts/' });
    let pdf;
    try {
      pdf = await loading.promise;
      if (pdf.numPages > 100) throw new Error('Please split this PDF into documents of 100 pages or fewer.');
      let chars = 0;
      for (let n = 1; n <= pdf.numPages; n++) {
        report(`Reading page ${n} of ${pdf.numPages}…`);
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str ?? '').join(' ');
        chars += text.length;
        if (chars > MAX_TEXT) throw new Error('This document has too much text. Please split it into smaller files (up to 180,000 characters each).');
        pages.push({ page: n, text }); page.cleanup();
      }
    } finally { await loading.destroy(); }
  } else if (ext === 'docx') {
    // Inspect ZIP metadata before decompression: reject encrypted/huge archives.
    const data = await file.arrayBuffer(), v = new DataView(data);
    let expanded = 0, entries = 0;
    for (let p = 0; p + 46 < v.byteLength; p++) {
      if (v.getUint32(p, true) !== 0x02014b50) continue;
      if (v.getUint16(p + 8, true) & 1) throw new Error('Encrypted documents are not supported. Export an unprotected copy first.');
      expanded += v.getUint32(p + 24, true); entries++;
      if (expanded > 30e6 || entries > 1500) throw new Error('This document expands to too much data. Export it as plain text or PDF.');
      p += 45 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    }
    if (!entries) throw new Error('This file is not a valid DOCX document.');
    const mammoth = await import('mammoth/mammoth.browser');
    const result = await mammoth.extractRawText({ arrayBuffer: data });
    pages = [{ page: null, text: result.value }];
  } else pages = [{ page: null, text: await file.text() }];
  const text = pages.map(p => p.text).join('\n');
  if (text.length > MAX_TEXT) throw new Error('Please use a shorter document (up to 180,000 characters).');
  if (text.trim().length < 30) throw new Error('There is not enough readable text. Scanned PDFs and images need OCR first; try a text-based file.');
  return { name: file.name, chunks: chunkPages(pages), pages: pages.length, characters: text.length, note };
}
