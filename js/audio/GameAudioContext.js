/**
 * GameAudioContext - Wraps the browser Web Audio API.
 * Named GameAudioContext (not AudioContext) to avoid shadowing the native browser class.
 */
class GameAudioContext {
    constructor() {
        this.context       = null;
        this.masterGain    = null;
        this.compressor    = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return true;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) throw new Error('Web Audio API not supported');

            this.context = new AC();
            await this.context.resume();

            this.compressor                  = this.context.createDynamicsCompressor();
            this.compressor.threshold.value  = -24;
            this.compressor.ratio.value      = 12;

            this.masterGain             = this.context.createGain();
            this.masterGain.gain.value  = 0.7;

            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);

            this.isInitialized = true;
            console.log('🔊 GameAudioContext initialized');
            return true;
        } catch (e) {
            console.error('❌ GameAudioContext init failed:', e.message);
            return false;
        }
    }

    /** The node everything should connect to (compressor → master gain → speakers). */
    getDestination() {
        return this.isInitialized ? this.compressor : (this.context?.destination || null);
    }

    setMasterVolume(level) {
        if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, level));
    }

    isReady() {
        return this.isInitialized && this.context?.state === 'running';
    }
}