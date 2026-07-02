class VehicleSounds {
  constructor(loader, audioCtx) {
    this.loader = loader;
    this.audioCtx = audioCtx;
    this.sources = { engine: null, drift: null, driftPolice: null };
    this.gains = { engine: null, drift: null, driftPolice: null };
    this.lastCrash = 0;

    this.activeSources = new Set();

    // EXACT PATHS MATCHING YOUR ASSETS
    // driftPolice reuses the same buffer — separate channel so both trucks
    // can screech independently.
    this.paths = {
      engine: 'assets/sounds/vehicle/engineSound.mp3',
      drift: 'assets/sounds/vehicle/driftSound.mp3',
      driftPolice: 'assets/sounds/vehicle/driftSound.mp3',
      crash: 'assets/sounds/vehicle/truckCrash.mp3'
    };
  }

  initGains() {
    ['engine', 'drift', 'driftPolice'].forEach(type => {
      this.gains[type] = this.audioCtx.context.createGain();
      this.gains[type].connect(this.audioCtx.getDestination());
    });
  }

  playLoop(type, playbackRate = 1.0, volume = 0.3) {
    if (this.sources[type] || !this.loader.has(this.paths[type])) return;

    const source = this.loader.createSource(this.paths[type]);
    if (!source) return;

    source.loop = true;
    source.playbackRate.value = playbackRate;
    this.gains[type].gain.value = volume;
    source.connect(this.gains[type]);
    source.start(0);
    this.sources[type] = source;
  }

  stopLoop(type) {
    if (this.sources[type]) {
      this.sources[type].stop();
      this.sources[type].disconnect();   // release the node; channel gain stays
      this.sources[type] = null;
    }
  }

  playCrash(speed) {
    const now = Date.now();
    if (now - this.lastCrash < 200) return; // Reduced to 200ms

    if (!this.loader.has(this.paths.crash)) {
      console.warn(`🔇 Crash sound NOT loaded: ${this.paths.crash}`);
      return;
    }

    const source = this.loader.createSource(this.paths.crash);
    const gain = this.audioCtx.context.createGain();

    // Track source to prevent Garbage Collection; tear the whole chain
    // down on end — otherwise each crash leaks a GainNode into the graph.
    this.activeSources.add(source);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.activeSources.delete(source);
    };

    const maxVol = Config.CRASH_VOLUME || 0.3;
    // Scale volume linearly with speed up to maxVol, without a minimum floor
    const vol = Math.min(1.0, speed / 12) * maxVol;
    gain.gain.value = Math.max(0.01, vol);

    source.connect(gain);
    gain.connect(this.audioCtx.getDestination());
    source.start(0);

    this.lastCrash = now;
  }

  update(speedRatio, absSpeed) {
    // Start engine if not playing (once audio is initialized)
    if (!this.sources.engine) {
      this.playLoop('engine', 0.8, (Config.ENGINE_VOLUME || 0.3) * 0.2);
    }

    // Update pitch and volume dynamically
    if (this.sources.engine) {
      // Pitch: 0.8 at idle, up to 1.5 at max speed
      this.sources.engine.playbackRate.value = 0.8 + speedRatio * 0.7;

      // Volume:
      // Idle (speed 0) -> 0.2 * Config Volume
      // Max (speed 1) - > 0.7 * Config Volume
      const targetVol = (0.2 + (0.5 * Math.pow(speedRatio, 0.8))) * (Config.ENGINE_VOLUME || 0.3);
      this.gains.engine.gain.value = targetVol;
    }
  }

  /**
   * Drive one drift channel ('drift' = player, 'driftPolice' = chase car).
   * Volume/pitch track slip intensity every frame, not just at loop start.
   */
  updateDrift(channel, isDrifting, speedRatio, volume) {
    if (isDrifting) {
      if (!this.sources[channel]) {
        this.playLoop(channel, 0.9 + speedRatio * 0.3, volume);
      } else {
        this.sources[channel].playbackRate.value = 0.9 + speedRatio * 0.3;
        const g = this.gains[channel].gain;
        g.value += (volume - g.value) * 0.15;   // smooth toward target
      }
    } else if (this.sources[channel]) {
      this.stopLoop(channel);
    }
  }
}