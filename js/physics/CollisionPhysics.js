/**
 * CollisionPhysics — Facade. Delegates to:
 *   SATDetection, ColliderHelpers, CollisionDetection, CollisionResponse.
 *
 * Keeps the old static API so World.js / VehiclePhysics don't need changes.
 */
class CollisionPhysics {

    // ── Detection (delegate to SATDetection) ─────────────────
    static rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return SATDetection.rectOverlap(ax, ay, aw, ah, bx, by, bw, bh);
    }

    static rectWithRotatedRect(rx, ry, rw, rh, cx, cy, cw, ch, angle) {
        return SATDetection.rectVsRotated(rx, ry, rw, rh, cx, cy, cw, ch, angle);
    }

    // ── Collider builders (delegate to ColliderHelpers) ──────
    static getBuildingCollider(building, drawSize) {
        return ColliderHelpers.building(building, drawSize);
    }

    static getPalmCollider(palm, drawSize) {
        return ColliderHelpers.palm(palm, drawSize);
    }

    static getCamelCollider(camel, drawSize) {
        return ColliderHelpers.camel(camel, drawSize);
    }

    // ── Queries (delegate to CollisionDetection) ─────────────
    static getCollisions(vehicle, world) {
        return CollisionDetection.getCollisions(vehicle, world);
    }

    static camelOverlapsObstacle(cx, cy, camel, world, playerTruck) {
        return CollisionDetection.camelOverlaps(cx, cy, camel, world, playerTruck);
    }

    // ── Response (delegate to CollisionResponse) ─────────────
    static resolve(v, collisions, world) {
        return CollisionResponse.resolve(v, collisions, world);
    }
}
