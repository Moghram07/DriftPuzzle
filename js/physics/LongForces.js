/**
 * LongForces — Forward/brake/reverse acceleration from input.
 * One job: given input + current speed, return longitudinal accel.
 */
class LongForces {

    /**
     * @param {object} input    - { throttle, handbrake }
     * @param {number} vLong    - current forward speed (px/f)
     * @param {number} absSpeed - total speed magnitude (px/f)
     * @returns {number} longitudinal acceleration (px/frame²)
     */
    static compute(input, vLong, absSpeed) {
        const C = Config;
        let ax = 0;

        if (input.handbrake) {
            ax -= Math.sign(vLong || 0.001) * C.HANDBRAKE_DECEL;

        } else if (input.throttle > 0) {
            if (vLong < -0.1) {
                // Moving backward + forward input → brake
                ax += C.ACCEL_BRAKE;
            } else {
                // Forward: diminishing returns near max speed
                const frac = Math.min(absSpeed / C.MAX_SPEED, 1);
                ax += C.ACCEL_FORWARD * (1 - frac * 0.7);
            }

        } else if (input.throttle < 0) {
            if (vLong > 0.3) {
                // Moving forward + back input → brake
                ax -= C.ACCEL_BRAKE;
            } else {
                // Reverse: diminishing near reverse max
                const frac = Math.min(Math.abs(vLong) / C.REVERSE_MAX, 1);
                ax -= C.ACCEL_REVERSE * (1 - frac * 0.6);
            }
        }

        // Rolling resistance
        if (Math.abs(vLong) > 0.01) {
            ax -= Math.sign(vLong) * C.ROLLING_RESIST;
        }

        return ax;
    }
}
