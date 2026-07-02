/**
 * CollisionResponse — Resolves vehicle-vs-obstacle collisions.
 *
 * Angle-dependent model:
 *   - Impact severity = velocity component INTO the wall (glancing hits are gentle).
 *   - Restitution grows with impact speed: slow contact hugs the wall,
 *     fast contact bounces off.
 *   - Tangential velocity is mostly preserved (wall-slide), scrubbed a bit by friction.
 *   - Drive-speed loss depends on how head-on the vehicle's heading was:
 *     frontal crash kills speed, a scrape barely slows you.
 *   - Off-center scrapes add a yaw kick (_impactYaw) so the nose swings along
 *     the slide direction instead of the car staying rigidly glued to its heading.
 */
class CollisionResponse {

    /** Axis-separated wall-slide + angle-dependent bounce. */
    static resolve(v, collisions, world) {
        const newX = v.x, newY = v.y;

        // Test X axis only
        v.x = newX; v.y = v.prevY;
        const xBlocked = world.getCollisions(v).length > 0;

        // Test Y axis only
        v.x = v.prevX; v.y = newY;
        const yBlocked = world.getCollisions(v).length > 0;

        // Accept safe axes
        v.x = xBlocked ? v.prevX : newX;
        v.y = yBlocked ? v.prevY : newY;
        if (xBlocked && yBlocked) v.th = v.prevTh;

        // Wall normal (screen space) — opposes the blocked motion
        let nSx = 0, nSy = 0;
        if (xBlocked) nSx = -(Math.sign(newX - v.prevX) || Math.sign(v.momentum.x) || 1);
        if (yBlocked) nSy = -(Math.sign(newY - v.prevY) || Math.sign(-v.momentum.y) || 1);
        const nLen = Math.sqrt(nSx * nSx + nSy * nSy) || 1;

        // Momentum space is y-up → flip the normal's y
        const nx = nSx / nLen, ny = -nSy / nLen;
        const vn = v.momentum.x * nx + v.momentum.y * ny;   // < 0 → moving into wall

        if (vn < 0) {
            const severity = -vn;

            // Speed-dependent restitution: remove into-wall velocity + bounce
            const e = 0.08 + Math.min(0.30, severity * 0.012);
            v.momentum.x -= (1 + e) * vn * nx;
            v.momentum.y -= (1 + e) * vn * ny;

            // Tangential scrub — glancing hits keep most of their slide speed
            const tx = -ny, ty = nx;
            const vt = v.momentum.x * tx + v.momentum.y * ty;
            const scrub = Math.min(0.45, severity * 0.02);
            v.momentum.x -= vt * scrub * tx;
            v.momentum.y -= vt * scrub * ty;

            // Heading alignment with the wall normal: 1 = head-on, 0 = parallel scrape
            const fx = Math.sin(v.th), fy = Math.cos(v.th);
            const frontal = Math.abs(fx * nx + fy * ny);
            v.speed *= 1 - frontal * Math.min(0.8, 0.25 + severity * 0.03);
            v.phi   *= 1 - frontal * 0.4;

            // Yaw kick: nose swings toward the slide direction on off-center hits
            const spin = Math.sign(vt * (fx * ty - fy * tx)) || 0;
            const kick = -spin * Math.min(0.12, severity * Math.abs(vt) * 0.0025);
            v._impactYaw = Math.max(-Config.VC_MAX_IMPACT_YAW,
                           Math.min( Config.VC_MAX_IMPACT_YAW, (v._impactYaw || 0) + kick));

            v.lastImpactForce = Math.max(severity * 1.6, frontal * Math.abs(v.speed) * 2);
        } else {
            v.lastImpactForce = 0;
        }

        // Cornered (both axes blocked): grind to a near stop
        if (xBlocked && yBlocked) {
            v.speed *= 0.2;
            v.phi   *= 0.2;
        }

        if (world.getCollisions(v).length > 0) {
            CollisionResponse._escape(v, collisions, world);
        }
        return collisions;
    }

    static _escape(v, collisions, world) {
        const hit = collisions[0];
        let obs = null;
        if      (hit.type === 'building') obs = world.getBuildingCollider(hit.obj);
        else if (hit.type === 'palm')     obs = world.getPalmCollider(hit.obj);
        else if (hit.type === 'camel')    obs = { x: hit.obj.x, y: hit.obj.y };

        if (obs) {
            const dx = v.x - obs.x, dy = v.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / dist, ny = dy / dist;
            for (let i = 0; i < 8; i++) {
                v.x += nx * (4 + i * 2);
                v.y += ny * (4 + i * 2);
                if (world.getCollisions(v).length === 0) break;
            }
        } else {
            v.x = v.prevX;
            v.y = v.prevY;
        }
        v.momentum.x = 0;
        v.momentum.y = 0;
        v.speed = 0;
        v._impactYaw = 0;
    }
}
