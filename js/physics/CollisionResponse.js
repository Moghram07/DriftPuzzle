/**
 * CollisionResponse — Resolves collisions: wall-slide, bounce, escape.
 */
class CollisionResponse {

    /** Axis-separated wall-slide + bounce. */
    static resolve(v, collisions, world) {
        const momMag = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
        v.lastImpactForce = Math.max(momMag, Math.abs(v.speed) * 2.5);

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

        // Bounce impulse
        if (xBlocked) v.momentum.x *= -0.15;
        if (yBlocked) v.momentum.y *= -0.15;

        // Kill yaw rate on collision
        v._yawRate = (v._yawRate || 0) * 0.3;

        const both = xBlocked && yBlocked;
        v.speed *= both ? 0.2 : 0.55;
        v.phi   *= both ? 0.2 : 0.6;

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
        v._yawRate = 0;
    }
}
