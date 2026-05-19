/**
 * GameAudio - Drives all runtime audio from game state.
 * Reads collisions to trigger crash/camel sounds.
 * Reads speed/drift state to update continuous engine sound.
 */
class GameAudio {
    static update(player, audioManager, lastCrashFrame) {
        if (!audioManager || !audioManager.initialized) return lastCrashFrame;

        const fc        = window.frameCount || 0;
        const absSpeed  = Math.abs(player.speed);
        const momMag    = Math.sqrt(player.momentum.x ** 2 + player.momentum.y ** 2);
        const totalSpd  = absSpeed + momMag * 0.3;

        // ── Collision sounds ──────────────────────────────────────────────────
        if (player.frameCollisions && player.frameCollisions.length > 0) {
            if (totalSpd > 1.0 && (fc - lastCrashFrame) > 30) {
                const types = player.frameCollisions.map(h => h.type);

                if (types.includes('building') || types.includes('palm')) {
                    audioManager.playCrashSound(totalSpd);
                    lastCrashFrame = fc;
                }
                // Camel collision sound/physics handled in Camel.update() — no double-call here.
            }
        }

        // ── Continuous audio ──────────────────────────────────────────────────
        const isDrifting      = Math.abs(player.phi) > 0.5 && (absSpeed > 1 || momMag > 6);
        audioManager.update(player.speed, absSpeed, Config.MAX_SPEED, isDrifting);

        return lastCrashFrame;
    }
}