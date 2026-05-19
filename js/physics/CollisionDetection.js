/**
 * CollisionDetection — Queries the world for vehicle collisions.
 * Returns array of { type, obj } hits.
 */
class CollisionDetection {

    /** All collisions between vehicle and world objects. */
    static getCollisions(vehicle, world) {
        const hits = [];
        const vSize = vehicle.getColliderSize
            ? vehicle.getColliderSize()
            : { w: vehicle.w, h: vehicle.d };

        for (const b of world.buildings) {
            const bc = world.getBuildingCollider(b);
            if (SATDetection.rectVsRotated(
                bc.x, bc.y, bc.w, bc.h,
                vehicle.x, vehicle.y, vSize.w, vSize.h, vehicle.th))
                hits.push({ type: 'building', obj: b });
        }

        for (const p of world.palms) {
            const pc = world.getPalmCollider(p);
            if (SATDetection.rectVsRotated(
                pc.x, pc.y, pc.w, pc.h,
                vehicle.x, vehicle.y, vSize.w, vSize.h, vehicle.th))
                hits.push({ type: 'palm', obj: p });
        }

        for (const camel of world.camels) {
            if (!camel || camel === vehicle) continue;
            const cc = camel.getCollider();
            if (SATDetection.rectVsRotated(
                cc.x, cc.y, cc.w, cc.h,
                vehicle.x, vehicle.y, vSize.w, vSize.h, vehicle.th))
                hits.push({ type: 'camel', obj: camel });
        }

        return hits;
    }

    /** Check if camel at (cx,cy) overlaps any obstacle. */
    static camelOverlaps(cx, cy, camel, world, playerTruck) {
        const cc = world.getCamelCollider({ x: cx, y: cy });

        for (const b of world.buildings) {
            const bc = world.getBuildingCollider(b);
            if (SATDetection.rectOverlap(cc.x, cc.y, cc.w, cc.h, bc.x, bc.y, bc.w, bc.h))
                return true;
        }
        for (const p of world.palms) {
            const pc = world.getPalmCollider(p);
            if (SATDetection.rectOverlap(cc.x, cc.y, cc.w, cc.h, pc.x, pc.y, pc.w, pc.h))
                return true;
        }
        if (playerTruck) {
            const ps = playerTruck.getColliderSize();
            if (SATDetection.rectVsRotated(
                cc.x, cc.y, cc.w, cc.h,
                playerTruck.x, playerTruck.y, ps.w, ps.h, playerTruck.th))
                return true;
        }
        return false;
    }
}
