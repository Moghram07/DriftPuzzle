/**
 * PoliceAI - Computes {throttle, steer} to chase the player.
 *
 * Strategy:
 *   1. Stuck detection: if police hasn't moved enough in 45 frames, enter recovery
 *   2. Recovery: reverse + steer for 25 frames, then drive forward 25 frames
 *   3. Ray-fan steering: cast 7 rays in a ±37° fan ahead, score each ray by
 *        (35% alignment to player) + (65% obstacle clearance)
 *      Steer toward the best-scoring ray direction.
 *   4. Throttle: full forward when facing player, coast when close
 *
 * AI state (_aiTimer, _aiLastX/Y, _aiRecovering) is stored on the vehicle
 * object so multiple police trucks each have independent state.
 */
class PoliceAI {

    static getInput(police, player, world) {
        if (!player) return { throttle: 0, steer: 0, handbrake: false };

        // ── Per-vehicle AI state (lazy-init on vehicle object) ────────────
        if (police._aiTimer === undefined) {
            police._aiTimer      = 0;
            police._aiLastX      = police.x;
            police._aiLastY      = police.y;
            police._aiRecovering = 0;
        }

        // ── Stuck detection — checked every 45 frames ─────────────────────
        // Trigger recovery if police moved < 10px total while not near player.
        police._aiTimer++;
        if (police._aiTimer % 45 === 0) {
            const mdx  = police.x - police._aiLastX;
            const mdy  = police.y - police._aiLastY;
            const moved = mdx * mdx + mdy * mdy;
            const distToPlayer = Math.sqrt(
                (player.x - police.x) ** 2 + (player.y - police.y) ** 2
            );
            if (moved < 100 && distToPlayer > 150) {
                police._aiRecovering = 50;  // 50 frames of recovery
            }
            police._aiLastX = police.x;
            police._aiLastY = police.y;
        }

        // ── Recovery mode ─────────────────────────────────────────────────
        if (police._aiRecovering > 0) {
            police._aiRecovering--;
            return PoliceAI._recoverInput(police, player);
        }

        // ── Direction to player ───────────────────────────────────────────
        const dx  = player.x - police.x;
        const dy  = player.y - police.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dx, -dy);

        let angleDiff = angleToPlayer - police.th;
        while (angleDiff >  Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // ── Ray-fan obstacle-aware steering ───────────────────────────────
        const steer = PoliceAI._computeSteering(police, angleToPlayer, world);

        // ── Throttle ─────────────────────────────────────────────────────
        let throttle;
        const absDiff = Math.abs(angleDiff);
        if      (absDiff < Math.PI * 0.5)  throttle =  1;    // facing player → full throttle
        else if (absDiff < Math.PI * 0.75) throttle =  0.4;  // sideways → gentle while turning
        else                               throttle = -0.5;  // facing away → back up briefly

        // Coast when very close so we don't ram through the player
        const momMag = Math.sqrt(police.momentum.x ** 2 + police.momentum.y ** 2);
        if (dist < 80 && momMag > 3) throttle = 0;

        return { throttle, steer, handbrake: false };
    }

    // ── Steering ──────────────────────────────────────────────────────────

    /**
     * Cast 7 rays in a fan (±37° either side of current heading).
     * Score each: 35% alignment-to-player  +  65% obstacle clearance.
     * Return steer input (-1/0/1) toward the best-scoring ray.
     */
    static _computeSteering(police, angleToPlayer, world) {
        const NUM_RAYS = 7;
        const SPREAD   = Math.PI * 0.75;   // total angular width of the fan
        const momMag   = Math.sqrt(police.momentum.x ** 2 + police.momentum.y ** 2);
        const lookDist = 70 + momMag * 12; // look further ahead at higher speed

        // Pre-compute all colliders once — reused across every ray cast
        const bcs = world.buildings.map(b => world.getBuildingCollider(b));
        const pcs = world.palms.map(p => world.getPalmCollider(p));

        let bestScore    = -Infinity;
        let bestRayAngle = angleToPlayer;

        for (let i = 0; i < NUM_RAYS; i++) {
            const t = (i / (NUM_RAYS - 1)) * 2 - 1;       // -1 .. +1
            const rayAngle = police.th + t * SPREAD / 2;

            // Alignment: 1 = ray points directly at player, 0 = perpendicular
            let diff = rayAngle - angleToPlayer;
            while (diff >  Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            const alignScore = 1 - Math.abs(diff) / Math.PI;

            // Clearance: fraction of lookDist reachable before hitting anything
            const clearance  = PoliceAI._rayClearance(police.x, police.y, rayAngle, lookDist, bcs, pcs);
            const clearScore = clearance / lookDist;

            const score = alignScore * 0.35 + clearScore * 0.65;
            if (score > bestScore) {
                bestScore    = score;
                bestRayAngle = rayAngle;
            }
        }

        // Convert best ray angle → steer input relative to current heading
        let steerDiff = bestRayAngle - police.th;
        while (steerDiff >  Math.PI) steerDiff -= 2 * Math.PI;
        while (steerDiff < -Math.PI) steerDiff += 2 * Math.PI;

        if (Math.abs(steerDiff) < 0.08) return 0;
        return steerDiff > 0 ? 1 : -1;
    }

    /**
     * Walk along a ray in STEPS increments.
     * Returns distance to the first obstacle hit, or maxDist if fully clear.
     * MARGIN adds a safety buffer so the AI steers clear of corners.
     */
    static _rayClearance(ox, oy, angle, maxDist, bcs, pcs) {
        const STEPS  = 6;
        const MARGIN = 20;
        const step   = maxDist / STEPS;
        const rx     = Math.sin(angle);
        const ry     = -Math.cos(angle);

        for (let s = 1; s <= STEPS; s++) {
            const px = ox + rx * s * step;
            const py = oy + ry * s * step;

            for (const bc of bcs) {
                if (Math.abs(px - bc.x) < bc.w / 2 + MARGIN &&
                    Math.abs(py - bc.y) < bc.h / 2 + MARGIN) {
                    return (s - 1) * step;   // hit — return clearance to previous step
                }
            }
            for (const pc of pcs) {
                const pdx = px - pc.x, pdy = py - pc.y;
                if (pdx * pdx + pdy * pdy < (pc.w / 2 + MARGIN) ** 2) {
                    return (s - 1) * step;
                }
            }
        }
        return maxDist;  // ray fully clear
    }

    // ── Recovery ──────────────────────────────────────────────────────────

    /**
     * Two-phase recovery:
     *   Frames 26–50: reverse + steer (swings nose toward open space / player)
     *   Frames  1–25: drive forward + steer toward player
     */
    static _recoverInput(police, player) {
        const angleToPlayer = Math.atan2(player.x - police.x, -(player.y - police.y));
        let diff = angleToPlayer - police.th;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const steer = diff > 0 ? 1 : -1;

        return police._aiRecovering > 25
            ? { throttle: -1, steer, handbrake: false }   // phase 1: reverse
            : { throttle:  1, steer, handbrake: false };  // phase 2: forward
    }
}
