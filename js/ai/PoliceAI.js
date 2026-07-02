/**
 * PoliceAI — Pursuit driver that models its own vehicle physics.
 *
 * The AI knows (all derived from VehiclePhysics/VehicleDynamics, game units
 * px/frame/rad):
 *   - Actual velocity  = speed·(sin th, -cos th) + (momentum.x, -momentum.y)/5
 *   - Yaw rate         ω = (speed/c)·(1 − 0.2·speed/6),  c = 50/tan(phi) + 15·sign(phi)
 *   - Braking distance D ≈ AI_BRAKE_K1·speed² + AI_BRAKE_K2·momentum  (~350 px at full speed)
 *   - Steady-state minimum turn radius ≈ AI_MIN_RADIUS (130 px)
 *
 * States (police._ai.state):
 *   PURSUIT — lead-pursuit aim + velocity-aligned ray fan + curvature-based
 *             target speed + P-controller steering on wheel angle.
 *   DRIFT   — hairpin reversal: full lock + throttle lift so the nose rotates
 *             on momentum lag, power out when realigned.
 *   RECOVER — context-aware unstick: reverse away from the obstacle that
 *             blocked us, exit as soon as the path ahead clears.
 *
 * Contract unchanged: getInput(police, player, world) → {throttle, steer, handbrake}.
 * All state lives on police._ai so multiple units stay independent.
 */
class PoliceAI {

    static getInput(police, player, world) {
        if (!player) return { throttle: 0, steer: 0, handbrake: false };

        const C  = Config;
        const ai = PoliceAI._state(police);

        // ── Sense ─────────────────────────────────────────────────────────
        const fwdX = Math.sin(police.th);
        const fwdY = -Math.cos(police.th);
        const velX = police.speed * fwdX + police.momentum.x / 5;
        const velY = police.speed * fwdY - police.momentum.y / 5;
        const pathSpeed = Math.sqrt(velX * velX + velY * velY);
        const momMag    = Math.sqrt(police.momentum.x ** 2 + police.momentum.y ** 2);
        const absSpeed  = Math.abs(police.speed);

        const dx = player.x - police.x;
        const dy = player.y - police.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Player velocity (player updates before police, so prev* is this frame's delta)
        const pvx = player.x - player.prevX;
        const pvy = player.y - player.prevY;
        const playerSpd = Math.sqrt(pvx * pvx + pvy * pvy);

        // Collision context (frameCollisions holds LAST frame's hits here)
        if (police.frameCollisions && police.frameCollisions.length > 0) {
            const hit = police.frameCollisions[0];
            let obs = null;
            if      (hit.type === 'building') obs = world.getBuildingCollider(hit.obj);
            else if (hit.type === 'palm')     obs = world.getPalmCollider(hit.obj);
            else if (hit.type === 'camel')    obs = { x: hit.obj.x, y: hit.obj.y };
            if (obs) {
                const ox = police.x - obs.x, oy = police.y - obs.y;
                const om = Math.sqrt(ox * ox + oy * oy) || 1;
                ai.lastBlock = { x: ox / om, y: oy / om };
            }
            ai.contactFrames++;
        } else {
            ai.contactFrames = 0;
        }

        const statics = PoliceAI._statics(world);
        const margin  = C.AI_MARGIN_BASE + C.AI_MARGIN_SPEED_K * pathSpeed;

        // ── Stuck detection (EMA of displacement) ─────────────────────────
        const moved = Math.sqrt((police.x - ai.lastX) ** 2 + (police.y - ai.lastY) ** 2);
        ai.lastX = police.x; ai.lastY = police.y;
        ai.avgMove = 0.9 * ai.avgMove + 0.1 * moved;
        if (ai.recoverCooldown > 0) ai.recoverCooldown--;

        if (ai.state !== 'RECOVER') {
            const commanding = Math.abs(ai.lastThrottle) >= 0.5;
            if (ai.avgMove < C.AI_STUCK_SPEED && commanding && dist > 120) ai.stuckFrames++;
            else ai.stuckFrames = 0;

            const fastStuck = ai.contactFrames >= 8 && pathSpeed < 0.6;
            if ((ai.stuckFrames > C.AI_STUCK_WINDOW || fastStuck) && ai.recoverCooldown === 0) {
                ai.state = 'RECOVER';
                ai.recoverT = 0;
                ai.stuckFrames = 0;
            }
        }

        // ── RECOVER ───────────────────────────────────────────────────────
        if (ai.state === 'RECOVER') {
            ai.recoverT++;

            // Escape heading: away from the blocking obstacle, biased toward player
            let ex = ai.lastBlock ? ai.lastBlock.x : -fwdX;
            let ey = ai.lastBlock ? ai.lastBlock.y : -fwdY;
            ex = ex * 0.6 + (dx / dist) * 0.4;
            ey = ey * 0.6 + (dy / dist) * 0.4;
            const escapeAngle = Math.atan2(ex, -ey);
            const alpha = PoliceAI._wrap(escapeAngle - police.th);

            const clearAhead  = PoliceAI._rayClearance(
                police.x + fwdX * 25, police.y + fwdY * 25, police.th, 150, statics, C.AI_MARGIN_BASE);
            const errToPlayer = Math.abs(PoliceAI._wrap(Math.atan2(dx, -dy) - police.th));

            const done =
                (ai.recoverT >= C.AI_RECOVER_MIN &&
                 clearAhead > C.AI_RECOVER_CLEAR &&
                 errToPlayer < 1.4) ||
                ai.recoverT >= C.AI_RECOVER_MAX;

            if (!done) {
                // Reversing: heading rotates OPPOSITE the wheel sign → negate
                const steer = Math.max(-1, Math.min(1, -alpha * 2));
                ai.lastThrottle = -1;
                PoliceAI._debug(ai, 'RECOVER', 0, null);
                return { throttle: -1, steer, handbrake: false };
            }
            ai.state = 'PURSUIT';
            ai.recoverCooldown = C.AI_RECOVER_COOLDOWN;
        }

        // ── Lead-pursuit aim point ────────────────────────────────────────
        let T = Math.min(C.AI_LEAD_MAX_T, dist / Math.max(1.5, pathSpeed));
        let aimX = player.x + pvx * T;
        let aimY = player.y + pvy * T;
        for (let i = 0; i < 3 && PoliceAI._pointBlocked(aimX, aimY, statics, 30); i++) {
            T *= 0.5;
            aimX = player.x + pvx * T;
            aimY = player.y + pvy * T;
        }
        const aimAngle = Math.atan2(aimX - police.x, -(aimY - police.y));
        const aimDist  = Math.sqrt((aimX - police.x) ** 2 + (aimY - police.y) ** 2) || 1;
        const alpha    = PoliceAI._wrap(aimAngle - police.th);

        // ── DRIFT (hairpin reversal) ──────────────────────────────────────
        if (ai.state === 'DRIFT') {
            ai.driftT++;
            const absA = Math.abs(alpha);
            if (absA < 0.25 || ai.driftT > C.AI_DRIFT_TIMEOUT) {
                ai.state = 'PURSUIT';
            } else {
                // Full lock; lift while the nose swings, power out once realigned
                const throttle = absA > 0.5 ? 0 : 1;
                ai.lastThrottle = throttle;
                PoliceAI._debug(ai, 'DRIFT', 0, { x: aimX, y: aimY });
                return { throttle, steer: Math.sign(alpha), handbrake: false };
            }
        }
        if (ai.state === 'PURSUIT' &&
            Math.abs(alpha) > C.AI_DRIFT_ANGLE_MIN &&
            pathSpeed > C.AI_DRIFT_SPEED_MIN) {
            // Only drift when the inside of the turn is open
            const sideAngle = police.th + Math.sign(alpha) * Math.PI / 2;
            const sideClear = PoliceAI._rayClearance(police.x, police.y, sideAngle, 120, statics, C.AI_MARGIN_BASE);
            if (sideClear > 100) {
                ai.state  = 'DRIFT';
                ai.driftT = 0;
                ai.lastThrottle = 0;
                PoliceAI._debug(ai, 'DRIFT', 0, { x: aimX, y: aimY });
                return { throttle: 0, steer: Math.sign(alpha), handbrake: false };
            }
        }

        // ── PURSUIT: velocity-aligned ray fan ─────────────────────────────
        // A sliding car must look where it's GOING, not where it points.
        let centerAngle = police.th;
        if (pathSpeed > 0.5) {
            const velAngle = Math.atan2(velX, -velY);
            const momShare = Math.min(1, (momMag / 5) / Math.max(0.1, pathSpeed));
            centerAngle = police.th + PoliceAI._wrap(velAngle - police.th) * momShare;
        }

        const lookDist = Math.max(C.AI_LOOK_MIN,
                         C.AI_BRAKE_K1 * police.speed * police.speed
                       + C.AI_BRAKE_K2 * momMag
                       + C.AI_LOOK_BUFFER);

        // Physical yaw-rate cap at current speed (≈0.074 rad/frame at v=6).
        // maxReach uses a generous floor so low-speed rays aren't over-pruned.
        const omegaCap = (Math.max(absSpeed, 0.3) / 65) * (1 - Math.min(absSpeed, 29) / 30);
        const maxReach = Math.max(omegaCap, 0.15) * C.AI_STEER_HORIZON + 0.35;

        const originX = police.x + fwdX * 25;   // front bumper
        const originY = police.y + fwdY * 25;

        let bestScore = -Infinity, bestAngle = aimAngle, bestClear = lookDist;
        ai.rays.length = 0;
        for (let i = 0; i < C.AI_NUM_RAYS; i++) {
            const t = (i / (C.AI_NUM_RAYS - 1)) * 2 - 1;
            const rayAngle = centerAngle + t * C.AI_RAY_SPREAD / 2;

            const offset = Math.abs(PoliceAI._wrap(rayAngle - police.th));
            const clear  = PoliceAI._rayClearance(originX, originY, rayAngle, lookDist, statics, margin);
            let score;
            if (offset > maxReach) {
                score = -Infinity;   // physically unreachable direction
            } else {
                // Multiplicative: alignment only counts in proportion to clearance,
                // so a blocked ray toward the player never beats an open detour.
                const align = 1 - Math.abs(PoliceAI._wrap(rayAngle - aimAngle)) / Math.PI;
                score = (clear / lookDist) *
                        (1 - C.AI_ALIGN_WEIGHT + C.AI_ALIGN_WEIGHT * align);
            }
            ai.rays.push({ angle: rayAngle, clear, chosen: false });
            if (score > bestScore) {
                bestScore = score; bestAngle = rayAngle; bestClear = clear;
                ai.chosenRay = ai.rays.length - 1;
            }
        }
        if (ai.rays[ai.chosenRay]) ai.rays[ai.chosenRay].chosen = true;

        // Boxed in: every direction is essentially blocked and we're crawling —
        // don't grind the wall, back out instead.
        if (bestClear < 25 && pathSpeed < 1.2 && dist > 120 && ai.recoverCooldown === 0) {
            ai.state = 'RECOVER';
            ai.recoverT = 0;
            ai.lastThrottle = -1;
            PoliceAI._debug(ai, 'RECOVER', 0, null);
            return { throttle: -1, steer: 0, handbrake: false };
        }

        // ── Curvature-based target speed ──────────────────────────────────
        let vTarget = C.MAX_SPEED;
        const sinA = Math.sin(Math.min(Math.abs(alpha), Math.PI / 2));
        if (sinA > 0.05) {
            const rReq = aimDist / (2 * sinA);
            vTarget = Math.max(C.AI_CORNER_MIN_SPEED,
                      Math.min(C.MAX_SPEED, 30 * (1 - C.AI_MIN_RADIUS / rReq)));
        }
        // Obstacle constraint: never carry more speed than can stop in the clear space
        if (bestClear < lookDist) {
            const vObs = Math.sqrt(Math.max(0, bestClear - margin) / C.AI_BRAKE_K1);
            vTarget = Math.min(vTarget, Math.max(0.6, vObs));
        }
        // Contact: press into the player instead of flying past
        if (dist < C.AI_CONTACT_RANGE) {
            vTarget = Math.min(C.MAX_SPEED, playerSpd + C.AI_CONTACT_OVERSPEED);
        }

        // ── Throttle band ─────────────────────────────────────────────────
        let throttle;
        if      (police.speed < vTarget - 0.3) throttle = 1;
        else if (police.speed > vTarget + 0.5) throttle = police.speed > 0.5 ? -1 : 0;
        else                                   throttle = 0;

        // ── Steering: P-controller on wheel angle ─────────────────────────
        const steerErr = PoliceAI._wrap(bestAngle - police.th);
        let phiDes;
        if (police.speed < 0.3) {
            phiDes = Math.sign(steerErr) * C._STEER_MAX;   // crank wheels while slow
        } else {
            const wDes = Math.max(-omegaCap, Math.min(omegaCap, steerErr / C.AI_STEER_HORIZON));
            if (Math.abs(wDes) < 1e-4) {
                phiDes = 0;
            } else {
                // Invert ω = (speed/c)(1 − 0.2·speed/6), c = 50/tan(phi) + 15·sign(phi).
                // Since (1 − 0.2·s/6) ≡ (1 − s/30), the ω cap guarantees cDes ≥ 65 > 15,
                // so the denominator never flips sign.
                const cDes = police.speed * (1 - 0.2 * absSpeed / 6) / wDes;
                phiDes = Math.atan(50 / (cDes - 15 * Math.sign(cDes)));
                phiDes = Math.max(-C._STEER_MAX, Math.min(C._STEER_MAX, phiDes));
            }
        }
        const steer = Math.max(-1, Math.min(1, C.AI_STEER_KP * (phiDes - police.phi)));

        ai.lastThrottle = throttle;
        PoliceAI._debug(ai, 'PURSUIT', vTarget, { x: aimX, y: aimY });
        return { throttle, steer, handbrake: false };
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    static _state(police) {
        if (!police._ai) {
            police._ai = {
                state: 'PURSUIT',
                stuckFrames: 0, avgMove: 1,
                lastX: police.x, lastY: police.y,
                recoverT: 0, recoverCooldown: 0,
                contactFrames: 0, driftT: 0,
                lastThrottle: 0, lastBlock: null,
                // debug/overlay
                aim: null, vTarget: 0, rays: [], chosenRay: -1
            };
        }
        return police._ai;
    }

    static _debug(ai, state, vTarget, aim) {
        ai.state = state;
        ai.vTarget = vTarget;
        ai.aim = aim;
    }

    static _statics(world) {
        if (world.getStaticColliders) return world.getStaticColliders();
        return {   // stub worlds (tests) — build throwaway lists
            buildings: world.buildings.map(b => ({ obj: b, col: world.getBuildingCollider(b) })),
            palms:     world.palms.map(p => ({ obj: p, col: world.getPalmCollider(p) }))
        };
    }

    static _wrap(a) {
        while (a >  Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    /** Distance to first obstacle along the ray, or maxDist if clear. */
    static _rayClearance(ox, oy, angle, maxDist, statics, margin) {
        const STEPS = Config.AI_RAY_STEPS;
        const step  = maxDist / STEPS;
        const rx = Math.sin(angle);
        const ry = -Math.cos(angle);
        for (let s = 1; s <= STEPS; s++) {
            const px = ox + rx * s * step;
            const py = oy + ry * s * step;
            if (PoliceAI._pointBlocked(px, py, statics, margin)) return (s - 1) * step;
        }
        return maxDist;
    }

    static _pointBlocked(px, py, statics, margin) {
        for (const { col } of statics.buildings) {
            if (Math.abs(px - col.x) < col.w / 2 + margin &&
                Math.abs(py - col.y) < col.h / 2 + margin) return true;
        }
        for (const { col } of statics.palms) {
            const dx = px - col.x, dy = py - col.y;
            const r  = col.w / 2 + margin;
            if (dx * dx + dy * dy < r * r) return true;
        }
        return false;
    }
}
