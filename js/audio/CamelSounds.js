class CamelSounds {
  constructor(loader, audioCtx) {
    this.loader = loader;
    this.audioCtx = audioCtx;
    this.lastPlayed = 0;
    this.cooldown = 2000;

    // EXACT PATHS MATCHING YOUR ASSETS (case-sensitive!)
    this.paths = {
      normal: 'assets/sounds/camel/normalCamel.mp3',
      agitated: 'assets/sounds/camel/AgitatedCamel.mp3',
      angry: 'assets/sounds/camel/AngryCamel.mp3'
    };
  }

  play(state = 'normal', hitSpeed = 3) {
    const now = Date.now();
    if (now - this.lastPlayed < this.cooldown) return;

    const soundKey = state.toLowerCase();
    const path = this.paths[soundKey] || this.paths.normal;

    if (!this.loader.has(path)) {
      console.warn(`🔇 Camel sound NOT loaded: ${path}. Available:`, Array.from(this.loader.buffers.keys()));
      return;
    }

    const source = this.loader.createSource(path);
    if (!source) {
      console.error(`❌ Failed to create source for ${path}`);
      return;
    }

    const gain = this.audioCtx.context.createGain();
    const maxVol = Config.CAMEL_VOLUME || 0.3;
    // Per-state minimum so gentle bumps are still audible
    const stateMin = { normal: 0.7, agitated: 0.6, angry: 0.3 };
    const minVol = stateMin[soundKey] || 0.5;
    const speedScale = Math.min(1.0, hitSpeed / 8);
    const vol = Math.max(minVol, speedScale) * maxVol;
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(this.audioCtx.getDestination());
    source.start(0);

    // Tear down the chain when playback ends — prevents GainNode buildup
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };

    this.lastPlayed = now;
  }
}