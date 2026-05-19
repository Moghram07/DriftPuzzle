/**
 * PhysicsOverrides — Monkey-patches so sliders control real physics.
 * J-turn: ~20 lines inside drive()'s reverse block. No separate class.
 */
class PhysicsOverrides {

    static install() {
        this._patchUpdate();
        this._patchSteer();
        this._patchAccel();
        this._patchMove();
        this._patchDrive();
    }

    static _patchUpdate() {
        VehiclePhysics.update = function(v, input, world, smuggler) {
            v.saveState();
            const mm = Math.sqrt(v.momentum.x**2 + v.momentum.y**2);
            const fc = (typeof window!=='undefined' && window.frameCount) ? window.frameCount : 0;
            const spin = fc < v.spinOutUntil;
            const wouldSpin = Config.SPIN_OUT_ENABLED &&
                Math.abs(v.phi) > Config.SPIN_OUT_THRESHOLD &&
                Math.abs(v.speed) > Config.SPIN_OUT_SPEED_THRESHOLD &&
                mm > Config.SPIN_OUT_MOMENTUM_THRESHOLD;
            if (spin) {
                v.speed *= 0.92; v.phi *= 0.85;
                v.th += 0.08*(v.momentum.x*Math.cos(v.th)-v.momentum.y*Math.sin(v.th))/Math.max(1,mm);
                v.momentum.x *= 0.97; v.momentum.y *= 0.97;
            } else {
                if (Config.SPIN_OUT_ENABLED && wouldSpin) v.spinOutUntil = fc + 25;
                v.momentum.x += (v.speed * Math.sin(v.th)) / Config._MOM_ACCUM;
                v.momentum.y += (v.speed * Math.cos(v.th)) / Config._MOM_ACCUM;
                v.momentum.x *= Config._MOM_DECAY * Config.FRICTION;
                v.momentum.y *= Config._MOM_DECAY * Config.FRICTION;
            }
            VehiclePhysics._steer(v, input, spin);
            VehiclePhysics._accel(v, input, spin);
            const col = VehiclePhysics._move(v, world, smuggler, spin);
            v._speed=v.speed; v.vx=v.momentum.x; v.vy=v.momentum.y;
            v._absSpeed=Math.abs(v.speed);
            v._driftAngle=VehiclePhysics._driftAngle(v, mm);
            return col;
        };
    }

    static _patchSteer() {
        VehiclePhysics._steer = function(v, input, spin) {
            const as = Math.abs(v.speed), MX = Config._STEER_MAX, BS = Config._STEER_RATE;
            if (input.steer!==0 && !spin && (as>0.1||input.throttle!==0)) {
                const d=input.steer, p=Math.abs(v.phi)/MX, r=BS*(1-p*0.5);
                if(d>0&&v.phi<MX){v.phi+=r;if(v.phi>MX)v.phi=MX;}
                if(d<0&&v.phi>-MX){v.phi-=r;if(v.phi<-MX)v.phi=-MX;}
                if(v.phi===0)v.phi=d*0.01;
                v.speed *= 0.999 - Math.abs(v.phi/20);
                v.speed *= 0.999 * Config.FRICTION;
            } else if(Math.abs(v.phi)>0.01) { v.phi*=as<0.1?0.80:Config._STEER_RETURN; }
        };
    }

    static _patchAccel() {
        VehiclePhysics._accel = function(v, input, spin) {
            if (input.throttle>0 && !spin) {
                if(v.speed<Config.MAX_SPEED)
                    v.speed+=Config._FWD_ACCEL*(1-(Math.abs(v.speed)/Config.MAX_SPEED)*0.5)*Config.ACCEL;
            } else if (input.throttle<0 && !spin) {
                if(v.speed>-Config.REVERSE_SPEED)
                    v.speed-=Config._REV_ACCEL*(1-(Math.abs(v.speed)/Config.REVERSE_SPEED)*0.5)*Config.ACCEL;
                v.momentum.x*=(Config._REV_MOM_BRAKE||0.9)*Config.FRICTION;
                v.momentum.y*=(Config._REV_MOM_BRAKE||0.9)*Config.FRICTION;
            } else {
                const pf=(Math.abs(v.phi)/(Math.PI/3))*0.01;
                v.speed*=0.995*Config.FRICTION+pf;
                v.momentum.x*=0.95+pf*Config.FRICTION;
                v.momentum.y*=0.95+pf*Config.FRICTION;
            }
        };
    }

    static _patchMove() {
        VehiclePhysics._move = function(v, world, smuggler, spin) {
            if (!spin) {
                if (!world || !world.vehicleCollides(v, smuggler)) {
                    v.x += (v.momentum.x / Config._MOM_APPLY) * Config.MOMENTUM;
                    v.y -= (v.momentum.y / Config._MOM_APPLY) * Config.MOMENTUM;
                    VehicleDynamics.drive(v, {
                        maxSpeed:Config.MAX_SPEED, reverseSpeed:Config.REVERSE_SPEED,
                        drift:Config.DRIFT||1, momentum:Config.MOMENTUM
                    }, null);
                } else { v.speed*=0.3; v.momentum.x*=0.2; v.momentum.y*=0.2; }
                if (world) {
                    const h = world.getCollisions(v);
                    if (h.length>0) {
                        if (typeof CollisionResponse!=='undefined') return CollisionResponse.resolve(v,h,world);
                        if (typeof CollisionPhysics!=='undefined') return CollisionPhysics.resolve(v,h,world);
                    }
                }
                return [];
            }
            v.x += (v.momentum.x / Config._MOM_APPLY) * Config.MOMENTUM;
            v.y -= (v.momentum.y / Config._MOM_APPLY) * Config.MOMENTUM;
            return [];
        };
    }

    static _patchDrive() {
        VehicleDynamics.drive = function(v, params) {
            const p = params || {};
            const as = Math.abs(v.speed);

            if (v.speed < 0) {
                const revMax = p.reverseSpeed || Config.REVERSE_SPEED;

                // Enter Ackermann reverse when speed hits 85% max
                if (as >= revMax * 0.85 && Math.abs(v.phi) > 0.2) v._ackRev = true;
                // Exit: steer released or speed very low
                if (Math.abs(v.phi) < 0.1 || as < 0.5) v._ackRev = false;

                if (!v._ackRev) {
                    // ── Simple reverse ───────────────────────────────────
                    if (as > 0.01) { const r = as * (Config._REV_POS_MULT||1); v.x -= r * Math.sin(v.th); v.y += r * Math.cos(v.th); }
                    if (as > 0.1 && Math.abs(v.phi) > 0.01) {
                        const tr = v.d / Math.sin(Math.abs(v.phi)), av = as / tr;
                        const sf = 1 - (as / revMax) * (Config._REV_SPEED_DAMP||0.15);
                        v.th += -Math.sign(v.phi) * av * sf * (Config._REV_TURN_MULT||1.2);
                    }
                    return;
                }
                // else: fall through to Ackermann
            } else {
                v._ackRev = false;
            }

            // ── Ackermann: forward + J-turn ─────────────────────────────
            if (Math.abs(v.phi) > 0.01) {
                v.c = v.d / Math.tan(v.phi) + (v.phi / Math.abs(v.phi)) * (v.w / 2);
            } else { v.c = 9999; }
            const ps = v.phi / Math.abs(v.phi || 0.01);
            const cor = {
                x: v.x + ps * (v.d / 2) * Math.sin(-ps * v.th) + v.c * Math.cos(v.th),
                y: v.y + (v.d / 2) * Math.cos(v.th) + v.c * Math.sin(v.th)
            };
            const ms = p.maxSpeed || Config.MAX_SPEED;
            const dr = p.drift || Config.DRIFT;
            // Nose whip: in reverse Ackermann, heading rotates faster (front swings wide)
            const noseWhip = v._ackRev ? (Config._JT_NOSE_WHIP || 1.0) : 1.0;
            v.th += (v.speed / v.c) * (1.0 - (as / ms) * Config._HEADING_DAMP) * noseWhip;
            const drift = (dr * 100 * v.c) / Math.abs(v.c) * as * Math.abs(v.phi) / Math.abs(v.c);
            v.x = cor.x - (v.c + drift) * Math.cos(v.th) - ps * (v.d / 2) * Math.sin(-ps * v.th);
            v.y = cor.y - (v.c + drift) * Math.sin(v.th) - (v.d / 2) * Math.cos(v.th);
        };
    }
}