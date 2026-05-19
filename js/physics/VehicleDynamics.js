/**
 * VehicleDynamics - Ackermann steering model with drift.
 *
 * Forward: Ackermann arc + drift component → beautiful sliding.
 * Reverse below max: simple position + angular velocity → tight arc.
 * Reverse at max speed + hard steer: Ackermann with negative speed → J-turn.
 *
 * The _ackRev sticky flag enters Ackermann reverse when speed >= 85% max
 * and steer is hard. Stays until steer released or speed very low.
 * Speed bleeds naturally during J-turn → arc tightens → smooth exit.
 */
class VehicleDynamics {

    /**
     * Drive step — computes heading and position from Ackermann geometry.
     * Called once per frame from VehiclePhysics._move().
     */
    static drive(v, params) {
        const p = params || {};
        const as = Math.abs(v.speed);

        if (v.speed < 0) {
            const revMax = p.reverseSpeed || Config.REVERSE_SPEED;

            // Sticky flag: enter Ackermann reverse at high speed + hard steer
            if (as >= revMax * 0.85 && Math.abs(v.phi) > 0.2) v._ackRev = true;
            // Exit: steer released or speed very low
            if (Math.abs(v.phi) < 0.1 || as < 0.5) v._ackRev = false;

            if (!v._ackRev) {
                // ── Simple reverse: tight arc, no drift ─────────────────
                if (as > 0.01) {
                    const r = as * (Config._REV_POS_MULT || 1);
                    v.x -= r * Math.sin(v.th);
                    v.y += r * Math.cos(v.th);
                }
                if (as > 0.1 && Math.abs(v.phi) > 0.01) {
                    const tr = v.d / Math.sin(Math.abs(v.phi));
                    const av = as / tr;
                    const sf = 1 - (as / revMax) * (Config._REV_SPEED_DAMP || 0.15);
                    v.th += -Math.sign(v.phi) * av * sf * (Config._REV_TURN_MULT || 1.5);
                }
                return;
            }
            // else: fall through to Ackermann (J-turn)
        } else {
            v._ackRev = false;
        }

        // ── Ackermann: forward driving + J-turn ─────────────────────
        if (Math.abs(v.phi) > 0.01) {
            v.c = v.d / Math.tan(v.phi) + (v.phi / Math.abs(v.phi)) * (v.w / 2);
        } else {
            v.c = 9999;
        }

        const ps  = v.phi / Math.abs(v.phi || 0.01);
        const cor = {
            x: v.x + ps * (v.d / 2) * Math.sin(-ps * v.th) + v.c * Math.cos(v.th),
            y: v.y + (v.d / 2) * Math.cos(v.th) + v.c * Math.sin(v.th)
        };

        const ms = p.maxSpeed || Config.MAX_SPEED;
        const dr = p.drift    || Config.DRIFT;

        v.th += (v.speed / v.c) * (1.0 - (as / ms) * Config._HEADING_DAMP);

        const drift = (dr * 100 * v.c) / Math.abs(v.c) * as * Math.abs(v.phi) / Math.abs(v.c);

        v.x = cor.x - (v.c + drift) * Math.cos(v.th) - ps * (v.d / 2) * Math.sin(-ps * v.th);
        v.y = cor.y - (v.c + drift) * Math.sin(v.th) - (v.d / 2) * Math.cos(v.th);
    }
}