/**
 * JTurnPhysics — Direct slide model for J-turn.
 *
 * When reversing at near-max speed + hard steer:
 *   - Saves the travel direction at the moment J-turn starts
 *   - Position keeps moving along that saved direction (inertia)
 *   - Heading rotates fast (the whip)
 *   - The gap between heading and travel = visible slide
 *
 * Below threshold: returns false, caller uses normal reverse.
 */
class JTurnPhysics {

    /**
     * Check if J-turn conditions are met and apply slide physics.
     * @returns {boolean} true if J-turn was applied, false = use normal reverse
     */
    static apply(v, revMax) {
        const absSpeed = Math.abs(v.speed);
        const speedRatio = absSpeed / revMax;
        const thresh = Config._JTURN_THRESH || 0.8;
        const hardSteer = Math.abs(v.phi) > 0.3;

        // Not fast enough or not steering hard → normal reverse
        if (speedRatio < thresh || !hardSteer) {
            if (v._jturnActive) JTurnPhysics._killMomentum(v);
            v._jturnActive = false;
            v._jturnDir = null;
            return false;
        }

        // Lock travel direction at J-turn start
        if (!v._jturnActive) {
            v._jturnActive = true;
            v._jturnDir = { x: -Math.sin(v.th), y: Math.cos(v.th) };
            v._jturnSpeed = absSpeed;
            v._jturnStartTh = v.th;
        }

        // Check how far heading has rotated from start
        let rotated = Math.abs(v.th - v._jturnStartTh);
        if (rotated > Math.PI) rotated = 2 * Math.PI - rotated;
        const maxRotation = Math.PI * 0.85; // ~153 degrees max

        // If rotated enough, end J-turn (let normal reverse take over)
        if (rotated >= maxRotation) {
            JTurnPhysics._killMomentum(v);
            v._jturnActive = false;
            v._jturnDir = null;
            v.speed *= 0.7;
            return false;
        }

        // ── Position: slide along saved direction ──
        v._jturnSpeed *= (Config._JTURN_DECAY || 0.98);
        const slide = v._jturnSpeed * (Config._JTURN_SLIDE || 0.7) * Config._REV_POS_MULT;

        const blend = Config._JTURN_SLIDE || 0.7;
        const hdX = -Math.sin(v.th);
        const hdY =  Math.cos(v.th);
        v.x += slide * (blend * v._jturnDir.x + (1 - blend) * hdX);
        v.y += slide * (blend * v._jturnDir.y + (1 - blend) * hdY);

        // ── Heading: fast whip, slowing as we approach max rotation ──
        if (absSpeed > 0.1) {
            const tr = v.d / Math.sin(Math.abs(v.phi));
            const av = absSpeed / tr;
            const sf = 1.0 - (absSpeed / revMax) * (Config._REV_SPEED_DAMP || 0.15);
            const turnRate = Config._JTURN_HEADING || 1.8;
            // Ease off as rotation approaches limit
            const rotProgress = rotated / maxRotation; // 0..1
            const ease = 1.0 - rotProgress * rotProgress; // quadratic ease-out
            v.th += -Math.sign(v.phi) * av * sf * turnRate * ease;
        }

        return true;
    }

    /**
     * During J-turn, reduce momentum braking so momentum survives.
     * Call this instead of normal reverse momentum braking.
     */
    static preserveMomentum(v) {
        const decay = Config._JTURN_MOM_KEEP || 0.99;
        v.momentum.x *= decay;
        v.momentum.y *= decay;
    }

    /** Kill backward momentum to prevent jump-back */
    static _killMomentum(v) {
        v.momentum.x *= 0.15;
        v.momentum.y *= 0.15;
    }

    /** Reset J-turn state (call when speed goes positive). */
    static reset(v) {
        if (v._jturnActive) JTurnPhysics._killMomentum(v);
        v._jturnActive = false;
        v._jturnDir = null;
        v._jturnSpeed = 0;
        v._jturnStartTh = 0;
    }
}