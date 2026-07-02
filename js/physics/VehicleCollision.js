/**
 * VehicleCollision — Rigid-body impulse resolution for vehicle-vs-vehicle impacts.
 *
 * Model (2D, single contact point from SAT MTV):
 *   - Relative velocity at the contact point includes each body's yaw rate,
 *     so off-center hits produce rotation, not just a shove.
 *   - Normal impulse:  J = -(1+e)·(vRel·n) / (1/mA + 1/mB + (rA×n)²/IA + (rB×n)²/IB)
 *     with restitution e growing with closing speed (slow nudges don't bounce,
 *     high-speed hits do).
 *   - Tangential (tire scrub) impulse, Coulomb-clamped to μ·|J|. μ drops when a
 *     vehicle is already sliding — drifting tires can't resist being shoved.
 *   - Impact direction is classified per vehicle (front / side / rear) from the
 *     normal vs its heading: frontal hits kill drive speed, rear hits push the
 *     car along, hard side hits break traction (spin-out).
 *   - Steering input and current slip angle act as a weight-transfer / grip
 *     proxy: a car mid-corner or mid-drift takes more rotation from the same hit.
 *
 * Coordinate note: game momentum is y-UP (position applies y with a minus sign),
 * so screen-space normals/offsets get their y flipped before any velocity math.
 */
class VehicleCollision {

    /**
     * Detect + resolve a collision between two vehicles.
     * Returns impact force (0 if no contact / already separating) for audio & particles.
     */
    static resolve(a, b, fc) {
        const sa = a.getColliderSize();
        const sb = b.getColliderSize();
        const mtv = SATDetection.obbVsObbMTV(
            a.x, a.y, sa.w, sa.h, a.th,
            b.x, b.y, sb.w, sb.h, b.th
        );
        if (!mtv) return 0;

        const invMassA = 1 / (a.mass || 1);
        const invMassB = 1 / (b.mass || 1);

        // ── Positional correction: push apart along the MTV, split by mass ──
        const push = Math.max(0.5, mtv.depth - Config.VC_SEPARATION_SLOP);
        const share = invMassA / (invMassA + invMassB);
        a.x += mtv.nx * push * share;
        a.y += mtv.ny * push * share;
        b.x -= mtv.nx * push * (1 - share);
        b.y -= mtv.ny * push * (1 - share);

        // ── Momentum space (y-up): flip y of the normal and contact offsets ──
        const nx = mtv.nx, ny = -mtv.ny;
        const rax = mtv.cx - a.x, ray = -(mtv.cy - a.y);
        const rbx = mtv.cx - b.x, rby = -(mtv.cy - b.y);

        // Velocity at contact point = translation + yaw-rate contribution.
        // K converts (rad/frame · px) into momentum units.
        const K  = Config._MOM_APPLY;
        const qa = a._impactYaw || 0;
        const qb = b._impactYaw || 0;
        const vax = a.momentum.x + K * qa * ray;
        const vay = a.momentum.y - K * qa * rax;
        const vbx = b.momentum.x + K * qb * rby;
        const vby = b.momentum.y - K * qb * rbx;

        const relVx = vax - vbx;
        const relVy = vay - vby;
        const vn = relVx * nx + relVy * ny;
        if (vn > 0) return 0;   // already separating

        // ── Grip / weight-transfer proxy per vehicle ──
        // Steering input + existing slip angle = loaded/sliding tires → the car
        // resists rotation less and its tires scrub less against the impact.
        const lossA = Math.min(1, Math.abs(a._driftAngle || 0) * 0.8 + Math.abs(a.phi) * 0.6);
        const lossB = Math.min(1, Math.abs(b._driftAngle || 0) * 0.8 + Math.abs(b.phi) * 0.6);

        // ── Normal impulse with speed-dependent restitution ──
        const e = Math.min(Config.VC_RESTITUTION_MAX,
                           Config.VC_RESTITUTION_MIN + (-vn) * 0.012);
        const IA = Config.VC_INERTIA, IB = Config.VC_INERTIA;
        const raCn = rax * ny - ray * nx;
        const rbCn = rbx * ny - rby * nx;
        const denom = invMassA + invMassB
                    + K * raCn * raCn / IA
                    + K * rbCn * rbCn / IB;
        const J = -(1 + e) * vn / denom;

        a.momentum.x += J * invMassA * nx;
        a.momentum.y += J * invMassA * ny;
        b.momentum.x -= J * invMassB * nx;
        b.momentum.y -= J * invMassB * ny;

        // ── Tangential (tire friction) impulse, Coulomb-clamped ──
        const tx = -ny, ty = nx;
        const vt = relVx * tx + relVy * ty;
        const raCt = rax * ty - ray * tx;
        const rbCt = rbx * ty - rby * tx;
        const denomT = invMassA + invMassB
                     + K * raCt * raCt / IA
                     + K * rbCt * rbCt / IB;
        const mu = Config.VC_FRICTION * (1 - 0.4 * Math.max(lossA, lossB));
        let Jt = -vt / denomT;
        Jt = Math.max(-mu * J, Math.min(mu * J, Jt));

        a.momentum.x += Jt * invMassA * tx;
        a.momentum.y += Jt * invMassA * ty;
        b.momentum.x -= Jt * invMassB * tx;
        b.momentum.y -= Jt * invMassB * ty;

        // ── Angular impulse → collision yaw (integrated by VehiclePhysics) ──
        // Sliding/steering vehicles take more rotation from the same impulse.
        const dqA = -(J * raCn + Jt * raCt) / IA * (1 + lossA * 0.8);
        const dqB =  (J * rbCn + Jt * rbCt) / IB * (1 + lossB * 0.8);
        const cap = Config.VC_MAX_IMPACT_YAW;
        a._impactYaw = Math.max(-cap, Math.min(cap, qa + dqA));
        b._impactYaw = Math.max(-cap, Math.min(cap, qb + dqB));

        // ── Impact direction → drive-speed & control effects ──
        VehicleCollision._applyImpactDirection(a, -nx, -ny, J * invMassA, lossA, fc);
        VehicleCollision._applyImpactDirection(b,  nx,  ny, J * invMassB, lossB, fc);

        const force = Math.abs(J) * 2;
        a.lastImpactForce = force;
        b.lastImpactForce = force;
        return force;
    }

    /**
     * Per-vehicle response based on where the hit landed.
     * (hx, hy) = direction the impact came FROM, in momentum space.
     */
    static _applyImpactDirection(v, hx, hy, dv, controlLoss, fc) {
        const fx = Math.sin(v.th), fy = Math.cos(v.th);
        const dot = fx * hx + fy * hy;   // +1 head-on into front, -1 into rear

        if (dot > 0.6) {
            // Frontal: engine/wheels take the hit — drive speed collapses
            v.speed *= Math.max(0.15, 1 - dv * 0.10);
            v.phi   *= 0.6;
        } else if (dot < -0.6) {
            // Rear: shunted forward — momentum handled above, speed mostly kept
            v.speed = Math.min(Config.MAX_SPEED, v.speed + dv * 0.15);
        } else {
            // Side: wheels aren't aligned with the shove — speed drops some,
            // and a hard enough hit breaks rear traction entirely.
            v.speed *= Math.max(0.4, 1 - dv * 0.05);
            const spinThreshold = Config.VC_SIDE_SPIN_IMPULSE * (1 - controlLoss * 0.4);
            if (dv > spinThreshold) {
                v.spinOutUntil = Math.max(v.spinOutUntil || 0, fc + 22);
            }
        }
    }
}
