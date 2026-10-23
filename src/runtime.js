export class LocalRuntime {
  worker = null; model = null; nextId = 0; pending = null;
  async run(job, onEvent) {
    if (this.pending) throw new Error('Another tool is still working. Stop it first.');
    if (this.model !== job.model) this.unload();
    if (!this.worker) {
      this.worker = new Worker(new URL('./inference.worker.js', import.meta.url), { type: 'module' });
      this.model = job.model;
      this.worker.onmessage = ({ data }) => {
        const active = this.pending;
        if (!active || data.id !== active.id) return;
        active.onEvent(data);
        if (data.type === 'done') { this.pending = null; active.resolve(data); }
        if (data.type === 'error') { this.pending = null; active.reject(new Error(data.message)); this.unload(); }
      };
      this.worker.onerror = event => { event.preventDefault(); this.unload(new Error(event.message || 'The model worker could not start. Please reload.')); };
      this.worker.onmessageerror = () => this.unload(new Error('The browser could not read the model result.'));
    }
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      this.pending = { id, resolve, reject, onEvent };
      this.worker.postMessage({ ...job, id });
    });
  }
  unload(error = new DOMException('Stopped. Your partial downloads may still be cached.', 'AbortError')) {
    this.worker?.terminate(); this.worker = null; this.model = null;
    if (this.pending) { const pending = this.pending; this.pending = null; pending.reject(error); }
  }
}
