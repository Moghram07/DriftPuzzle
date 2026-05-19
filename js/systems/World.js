/**
 * World - Coordinator for map data, camels, and collision.
 * Delegates layout to WorldMap. Delegates all collision math to CollisionPhysics.
 */
class World {
    constructor() {
        this.buildings  = WorldMap.buildings;
        this.palms      = WorldMap.palms;
        this.camels     = [];
        this.worldScale = Config.TRUCK_DRAW_H / ColliderData.TRUCK.spriteH;
    }

    initCamels(count = 5) {
        const areas = WorldMap.camelSpawnAreas;
        for (let i = 0; i < count && i < areas.length; i++) {
            const area = areas[i];
            this.camels.push(new Camel(
                area.x + random(-50, 50),
                area.y + random(-50, 50)
            ));
        }
    }

    // ── Draw size helpers (used by rendering) ─────────────────────────────────

    getBuildingDrawSize(building) {
        const img = AssetManager.images.buildings[building.img];
        if (!img || img.width <= 0) return { w: 100, h: 120 };
        return { w: img.width * this.worldScale, h: img.height * this.worldScale };
    }

    getPalmDrawSize() {
        const img = AssetManager.images.palm;
        if (!img || img.width <= 0) return { w: 60, h: 80 };
        return { w: img.width * this.worldScale, h: img.height * this.worldScale };
    }

    getCamelDrawSize() {
        const img = AssetManager.images.camel;
        if (!img || img.width <= 0) return { w: 60, h: 40 };
        const frameW = img.width / Config.CAMEL_FRAME_COUNT;
        return { w: frameW * this.worldScale, h: img.height * this.worldScale };
    }

    // ── Collider helpers (delegate to CollisionPhysics) ───────────────────────

    getBuildingCollider(building) {
        return CollisionPhysics.getBuildingCollider(building, this.getBuildingDrawSize(building));
    }

    getPalmCollider(palm) {
        return CollisionPhysics.getPalmCollider(palm, this.getPalmDrawSize());
    }

    getCamelCollider(camel) {
        return CollisionPhysics.getCamelCollider(camel, this.getCamelDrawSize());
    }

    getCollisions(vehicle) {
        return CollisionPhysics.getCollisions(vehicle, this);
    }

    vehicleCollides(vehicle, otherVehicle = null) {
        return CollisionPhysics.getCollisions(vehicle, this).length > 0;
    }

    camelOverlapsObstacle(cx, cy, camel, playerTruck) {
        return CollisionPhysics.camelOverlapsObstacle(cx, cy, camel, this, playerTruck);
    }
}