/**
 * GameAudio - Drives all runtime audio from game state.
 * Reads collisions to trigger crash/camel sounds.
 * Reads speed/drift state to update continuous engine + tire sounds.
 *
 * Drift sound is tire-slip based: it fires when a vehicle's velocity direction
 * diverges from its heading (v._driftAngle, computed by VehiclePhysics), so
 * post-impact slides and spin-outs screech too — same rule for player and
 * police. Police sounds are attenuated by distance to the player (listener).
 */
class GameAudio {

    static update(game) {
        const am = game.audioManager;
        if (!am || !am.initialized) return;

        const fc     = window.frameCount || 0;
        const player = game.player;
        const police = game.police;

        // Listener attenuation for the chase car: full volume within 200px,
        // fading to silent by ~900px.
        const pdx   = police.x - player.x;
        const pdy   = police.y - player.y;
        const dist  = Math.sqrt(pdx * pdx + pdy * pdy);
        const atten = Math.max(0, Math.min(1, 1 - (dist - 200) / 700));

        // ── Collision sounds ──────────────────────────────────────────────
        game.lastCrashFrame       = GameAudio._crash(player, am, fc, game.lastCrashFrame, 1);
        game.lastPoliceCrashFrame = GameAudio._crash(police, am, fc, game.lastPoliceCrashFrame, atten);

        // ── Engine (follows player) ───────────────────────────────────────
        am.update(player.speed, Math.abs(player.speed), Config.MAX_SPEED);

        // ── Drift / tire screech, one channel per vehicle ─────────────────
        const pd = GameAudio._driftState(player, fc);
        const cd = GameAudio._driftState(police, fc);
        const baseVol = Config.DRIFT_VOLUME || 0.25;
        am.updateDrift('drift',       pd.drifting,
                       pd.speedRatio, baseVol * (0.35 + 0.65 * pd.intensity));
        am.updateDrift('driftPolice', cd.drifting && atten > 0.02,
                       cd.speedRatio, baseVol * (0.35 + 0.65 * cd.intensity) * atten);
    }

    /** Obstacle crash sound with per-vehicle cooldown and volume scaling. */
    static _crash(v, am, fc, lastFrame, volScale) {
        if (!v.frameCollisions || v.frameCollisions.length === 0) return lastFrame;

        const momMag   = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        const totalSpd = Math.abs(v.speed) + momMag * 0.3;

        if (totalSpd > 1.0 && (fc - lastFrame) > 30 && volScale > 0.02) {
            for (const hit of v.frameCollisions) {
                if (hit.type === 'building' || hit.type === 'palm') {
                    am.playCrashSound(totalSpd * volScale);
                    return fc;
                }
                // Camel collision sound/physics handled in Camel.update() — no double-call here.
            }
        }
        return lastFrame;
    }

    /**
     * Tire-slip drift state for any vehicle.
     * Screeches when:
     *   - slip angle is large while carrying momentum (a real slide), or
     *   - hard steering at speed with the tail starting to step out, or
     *   - the vehicle is in a spin-out and still moving.
     */
    static _driftState(v, fc) {
        const momMag = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        const spd    = Math.abs(v.speed);
        const slip   = Math.abs(v._driftAngle || 0);
        const spinning = fc < (v.spinOutUntil || 0);

        const drifting =
            (slip > 0.30 && momMag > 5) ||
            (Math.abs(v.phi) > 0.5 && (spd > 1 || momMag > 6) && slip > 0.12) ||
            (spinning && momMag > 3);

        const intensity = drifting
            ? Math.max(0.25, Math.min(1, slip / 0.7) * Math.min(1, (momMag + spd * 2) / 16))
            : 0;

        return {
            drifting,
            intensity,
            speedRatio: Math.min(1, (spd + momMag * 0.2) / Config.MAX_SPEED)
        };
    }
}
