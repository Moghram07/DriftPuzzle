/**
 * Steering — Converts input.steer into front wheel angle v.phi.
 * Speed-dependent: less max angle and slower rate at high speed.
 */
class Steering {

    /**
     * Update v.phi from input.
     * @param {Vehicle} v
     * @param {object}  input - { steer: -1|0|1, throttle }
     */
    static update(v, input) {
        const C = Config;
        const absSpd = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        const ratio  = Math.min(absSpd / C.MAX_SPEED, 1);

        const maxPhi = C.STEER_MAX_ANGLE * (1 - ratio * 0.35);
        const rate   = C.STEER_RATE * (1 - ratio * C.STEER_SPEED_FACTOR);
        const canSteer = absSpd > C.STEER_LOCK_SPEED || input.throttle !== 0;

        if (input.steer !== 0 && canSteer) {
            Steering._apply(v, input.steer, rate, maxPhi);
        } else {
            Steering._center(v, absSpd);
        }
    }

    static _apply(v, dir, rate, maxPhi) {
        if (dir > 0 && v.phi < maxPhi)  v.phi = Math.min(v.phi + rate, maxPhi);
        if (dir < 0 && v.phi > -maxPhi) v.phi = Math.max(v.phi - rate, -maxPhi);
        if (v.phi === 0) v.phi = dir * 0.005;
    }

    static _center(v, absSpd) {
        if (Math.abs(v.phi) < 0.005) { v.phi = 0; return; }
        const rate = absSpd < Config.STEER_LOCK_SPEED ? 0.75 : Config.STEER_RETURN_RATE;
        v.phi *= rate;
        if (Math.abs(v.phi) < 0.005) v.phi = 0;
    }
}
