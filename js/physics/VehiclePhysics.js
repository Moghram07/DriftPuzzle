/**
 * VehiclePhysics - One physics tick per frame.
 *
 * Flow:
 *   update()  → momentum accumulation, steer, accel, move
 *   _steer()  → v.phi (front wheel angle) with speed bleed
 *   _accel()  → v.speed (engine intent)
 *   _move()   → momentum offset + VehicleDynamics.drive() for position
 */
class VehiclePhysics {

    static update(v, input, world, smugglerTruck = null) {
        v.saveState();
        const mm = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        const fc = window.frameCount || 0;
        const spin = fc < v.spinOutUntil;

        const wouldSpin = Config.SPIN_OUT_ENABLED &&
            Math.abs(v.phi) > Config.SPIN_OUT_THRESHOLD &&
            Math.abs(v.speed) > Config.SPIN_OUT_SPEED_THRESHOLD &&
            mm > Config.SPIN_OUT_MOMENTUM_THRESHOLD;

        if (spin) {
            v.speed *= 0.92;
            v.phi *= 0.85;
            v.th += 0.08 * (v.momentum.x * Math.cos(v.th) - v.momentum.y * Math.sin(v.th)) / Math.max(1, mm);
            v.momentum.x *= 0.97;
            v.momentum.y *= 0.97;
        } else {
            if (Config.SPIN_OUT_ENABLED && wouldSpin) {
                v.spinOutUntil = fc + 25;
            }
            // Accumulate momentum from speed
            v.momentum.x += (v.speed * Math.sin(v.th)) / Config._MOM_ACCUM;
            v.momentum.y += (v.speed * Math.cos(v.th)) / Config._MOM_ACCUM;
            v.momentum.x *= Config._MOM_DECAY * Config.FRICTION;
            v.momentum.y *= Config._MOM_DECAY * Config.FRICTION;
        }

        VehiclePhysics._steer(v, input, spin);
        VehiclePhysics._accel(v, input, spin);
        const collisions = VehiclePhysics._move(v, world, smugglerTruck, spin);

        v._speed = v.speed;
        v.vx = v.momentum.x;
        v.vy = v.momentum.y;
        v._absSpeed = Math.abs(v.speed);
        v._driftAngle = VehiclePhysics._driftAngle(v, mm);

        return collisions;
    }

    /**
     * Steering — converts input.steer into front wheel angle v.phi.
     * Includes speed bleed while steering (natural deceleration).
     */
    static _steer(v, input, spin) {
        const as = Math.abs(v.speed);
        const MX = Config._STEER_MAX;
        const BS = Config._STEER_RATE;

        if (input.steer !== 0 && !spin && (as > 0.1 || input.throttle !== 0)) {
            const d = input.steer;
            const p = Math.abs(v.phi) / MX;
            const r = BS * (1 - p * 0.5);

            if (d > 0 && v.phi < MX) { v.phi += r; if (v.phi > MX) v.phi = MX; }
            if (d < 0 && v.phi > -MX) { v.phi -= r; if (v.phi < -MX) v.phi = -MX; }
            if (v.phi === 0) v.phi = d * 0.01;

            // Speed bleed while steering
            v.speed *= 0.999 - Math.abs(v.phi / 20);
            v.speed *= 0.999 * Config.FRICTION;
        } else if (Math.abs(v.phi) > 0.01) {
            // Self-center wheels
            v.phi *= as < 0.1 ? 0.80 : Config._STEER_RETURN;
        }
    }

    /**
     * Acceleration — manages v.speed based on throttle input.
     */
    static _accel(v, input, spin) {
        if (input.throttle > 0 && !spin) {
            // Forward
            if (v.speed < Config.MAX_SPEED) {
                v.speed += Config._FWD_ACCEL * (1 - (Math.abs(v.speed) / Config.MAX_SPEED) * 0.5) * Config.ACCEL;
            }
        } else if (input.throttle < 0 && !spin) {
            // Reverse
            if (v.speed > -Config.REVERSE_SPEED) {
                v.speed -= Config._REV_ACCEL * (1 - (Math.abs(v.speed) / Config.REVERSE_SPEED) * 0.5) * Config.ACCEL;
            }
            v.momentum.x *= (Config._REV_MOM_BRAKE || 0.9) * Config.FRICTION;
            v.momentum.y *= (Config._REV_MOM_BRAKE || 0.9) * Config.FRICTION;
        } else {
            // Coasting
            const pf = (Math.abs(v.phi) / (Math.PI / 3)) * 0.01;
            v.speed *= 0.995 * Config.FRICTION + pf;
            v.momentum.x *= 0.95 + pf * Config.FRICTION;
            v.momentum.y *= 0.95 + pf * Config.FRICTION;
        }
    }

    /**
     * Position integration — momentum offset + Ackermann drive.
     */
    static _move(v, world, smuggler, spin) {
        if (!spin) {
            if (!world || !world.vehicleCollides(v, smuggler)) {
                // Momentum offset
                v.x += (v.momentum.x / Config._MOM_APPLY) * Config.MOMENTUM;
                v.y -= (v.momentum.y / Config._MOM_APPLY) * Config.MOMENTUM;
                // Ackermann position
                VehicleDynamics.drive(v, {
                    maxSpeed: Config.MAX_SPEED,
                    reverseSpeed: Config.REVERSE_SPEED,
                    drift: Config.DRIFT || 1,
                    momentum: Config.MOMENTUM
                }, null);
            } else {
                v.speed *= 0.3;
                v.momentum.x *= 0.2;
                v.momentum.y *= 0.2;
            }
            if (world) {
                const hits = world.getCollisions(v);
                if (hits.length > 0) {
                    return CollisionPhysics.resolve(v, hits, world);
                }
            }
            return [];
        }
        // Spinning — just momentum
        v.x += (v.momentum.x / Config._MOM_APPLY) * Config.MOMENTUM;
        v.y -= (v.momentum.y / Config._MOM_APPLY) * Config.MOMENTUM;
        return [];
    }

    /**
     * Compute drift angle for effects/HUD.
     */
    static _driftAngle(v, mm) {
        if (mm < 0.5) return 0;
        const headX = Math.sin(v.th);
        const headY = Math.cos(v.th);
        const dot = (v.momentum.x * headX + v.momentum.y * headY) / mm;
        return Math.acos(Math.max(-1, Math.min(1, dot)));
    }
}