class SoundLoader {
  constructor(audioContext) {
    this.context = audioContext;
    this.buffers = new Map();
  }

  async load(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);

    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.context.context.decodeAudioData(arrayBuffer);
      this.buffers.set(path, buffer);
      // console.log(`✅ Loaded: ${path}`);
      return buffer;
    } catch (e) {
      console.error(`❌ Failed to load ${path}:`, e);
      return null;
    }
  }

  async loadBatch(paths) {
    return Promise.all(paths.map(path => this.load(path)));
  }

  get(path) {
    return this.buffers.get(path) || null;
  }

  has(path) {
    return this.buffers.has(path);
  }

  createSource(path) {
    const buffer = this.get(path);
    if (!buffer) return null;

    const source = this.context.context.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}