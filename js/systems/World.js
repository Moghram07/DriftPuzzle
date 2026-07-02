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
        this._staticCache = null;   // built once sprite dimensions are valid
    }

    /**
     * Buildings and palms never move, but their colliders/draw sizes were being
     * rebuilt on every getCollisions call (up to ~13×/vehicle/frame). Cache them
     * once. Only memoize when the sprite images have real dimensions so a
     * fallback size is never frozen in.
     */
    _ensureStaticCache() {
        if (this._staticCache) return this._staticCache;

        const palmImg = AssetManager.images.palm;
        const ready =
            palmImg && palmImg.width > 0 &&
            this.buildings.every(b => {
                const img = AssetManager.images.buildings[b.img];
                return img && img.width > 0;
            });
        if (!ready) return null;   // callers fall back to per-item computation

        const cache = {
            buildingSizes:        new Map(),
            buildingColliders:    new Map(),
            palmColliders:        new Map(),
            palmSize:             this._computePalmDrawSize(),
            buildingColliderList: [],
            palmColliderList:     []
        };
        for (const b of this.buildings) {
            const size = this._computeBuildingDrawSize(b);
            const col  = CollisionPhysics.getBuildingCollider(b, size);
            cache.buildingSizes.set(b, size);
            cache.buildingColliders.set(b, col);
            cache.buildingColliderList.push({ obj: b, col });
        }
        for (const p of this.palms) {
            const col = CollisionPhysics.getPalmCollider(p, cache.palmSize);
            cache.palmColliders.set(p, col);
            cache.palmColliderList.push({ obj: p, col });
        }

        this._staticCache = cache;
        return cache;
    }

    /** Cached static colliders as flat lists — for hot loops (physics, AI rays). */
    getStaticColliders() {
        const c = this._ensureStaticCache();
        if (c) return { buildings: c.buildingColliderList, palms: c.palmColliderList };
        // Pre-asset frames only — throwaway lists via the fallback path
        return {
            buildings: this.buildings.map(b => ({ obj: b, col: this.getBuildingCollider(b) })),
            palms:     this.palms.map(p => ({ obj: p, col: this.getPalmCollider(p) }))
        };
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
        const c = this._ensureStaticCache();
        return (c && c.buildingSizes.get(building)) || this._computeBuildingDrawSize(building);
    }

    getPalmDrawSize() {
        const c = this._ensureStaticCache();
        return c ? c.palmSize : this._computePalmDrawSize();
    }

    _computeBuildingDrawSize(building) {
        const img = AssetManager.images.buildings[building.img];
        if (!img || img.width <= 0) return { w: 100, h: 120 };
        return { w: img.width * this.worldScale, h: img.height * this.worldScale };
    }

    _computePalmDrawSize() {
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
        const c = this._ensureStaticCache();
        return (c && c.buildingColliders.get(building)) ||
            CollisionPhysics.getBuildingCollider(building, this._computeBuildingDrawSize(building));
    }

    getPalmCollider(palm) {
        const c = this._ensureStaticCache();
        return (c && c.palmColliders.get(palm)) ||
            CollisionPhysics.getPalmCollider(palm, this._computePalmDrawSize());
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