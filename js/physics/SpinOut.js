/**
 * SpinOut — Detects and manages spin-out state.
 * Spin-out triggers when yaw rate exceeds threshold at speed.
 * During spin-out: dampen everything, let car rotate uncontrolled.
 */
class SpinOut {

    /** Check if spin-out should trigger. */
    static shouldTrigger(v) {
        if (!Config.SPIN_OUT_ENABLED) return false;
        const absSpd = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        // Trigger when car is nearly sideways (>80°) at high speed
        return Math.abs(v._driftAngle || 0) > 1.4 &&
               absSpd > Config.SPIN_OUT_SPEED_THRESHOLD;
    }

    /** Is vehicle currently in spin-out? */
    static isActive(v) {
        return (window.frameCount || 0) < v.spinOutUntil;
    }

    /** Begin spin-out. */
    static trigger(v) {
        v.spinOutUntil = (window.frameCount || 0) + Config.SPIN_OUT_DURATION;
    }

    /** Run one frame of spin-out physics. */
    static tick(v) {
        v.speed      *= 0.92;
        v.phi        *= 0.85;
        v.momentum.x *= 0.97;
        v.momentum.y *= 0.97;

        // Spin the car in the direction of the drift
        const spinDir = Math.sign(v._driftAngle || v.phi || 1);
        v.th += spinDir * 0.08;
    }
}