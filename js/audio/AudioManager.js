/**
 * AudioManager - Wires together GameAudioContext, SoundLoader, VehicleSounds, CamelSounds.
 */
class AudioManager {
    constructor(config) {
        this.config      = config;
        this.ctx         = new GameAudioContext();
        this.loader      = new SoundLoader(this.ctx);
        this.vehicle     = new VehicleSounds(this.loader, this.ctx);
        this.camel       = new CamelSounds(this.loader, this.ctx);
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        const ok = await this.ctx.init();
        if (!ok) return;

        const paths = [...new Set([
            ...Object.values(this.vehicle.paths),
            ...Object.values(this.camel.paths)
        ])];
        await this.loader.loadBatch(paths);
        this.vehicle.initGains();

        this.initialized = true;
        console.log('🎧 AudioManager fully initialized');
    }

    update(speed, absSpeed, maxSpeed, isDrifting) {
        if (!this.initialized) return;
        const speedRatio = Math.min(1, absSpeed / maxSpeed);
        this.vehicle.update(speedRatio, absSpeed, isDrifting);
    }

    playCrashSound(speed)        { if (this.initialized) this.vehicle.playCrash(speed); }
    playCamelSound(state, speed) { if (this.initialized) this.camel.play(state, speed); }
}