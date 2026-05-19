/**
 * ColliderHelpers — Builds world-space collider rects from sprite data.
 * Pure math: takes raw data, returns { x, y, w, h }.
 */
class ColliderHelpers {

    static building(building, drawSize) {
        const c = ColliderData.BUILDINGS && ColliderData.BUILDINGS[building.img];
        if (!c) return { x: building.x, y: building.y, w: drawSize.w, h: drawSize.h };
        const sx = drawSize.w / c.spriteW, sy = drawSize.h / c.spriteH;
        return {
            x: building.x + (c.bounds.x + c.bounds.w / 2 - c.spriteW / 2) * sx,
            y: building.y + (c.bounds.y + c.bounds.h / 2 - c.spriteH / 2) * sy,
            w: c.bounds.w * sx,
            h: c.bounds.h * sy
        };
    }

    static palm(palm, drawSize) {
        const c = ColliderData.PALM;
        if (!c) return { x: palm.x, y: palm.y, w: drawSize.w, h: drawSize.h };
        const sx = drawSize.w / c.spriteW, sy = drawSize.h / c.spriteH;
        return {
            x: palm.x + (c.bounds.x + c.bounds.w / 2 - c.spriteW / 2) * sx,
            y: palm.y + (c.bounds.y + c.bounds.h / 2 - c.spriteH / 2) * sy,
            w: c.bounds.w * sx,
            h: c.bounds.h * sy
        };
    }

    static camel(camel, drawSize) {
        const c = ColliderData.CAMEL;
        if (!c) return { x: camel.x, y: camel.y, w: drawSize.w * 0.6, h: drawSize.h * 0.6 };
        const sx = drawSize.w / c.spriteW, sy = drawSize.h / c.spriteH;
        return {
            x: camel.x + (c.bounds.x + c.bounds.w / 2 - c.spriteW / 2) * sx,
            y: camel.y + (c.bounds.y + c.bounds.h / 2 - c.spriteH / 2) * sy,
            w: c.bounds.w * sx,
            h: c.bounds.h * sy
        };
    }
}
