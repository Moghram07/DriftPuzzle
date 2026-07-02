/**
 * Vehicle - Base class for all drivable entities.
 * Owns: position, heading, steering angle, collider, sprite, state save/restore.
 * Does NOT own physics — VehiclePhysics handles that.
 */
class Vehicle {
    constructor(x, y, heading, colliderData, spriteImg) {
        this.x    = x;
        this.y    = y;
        this.th   = heading;
        this.phi  = 0;       // steering angle — starts perfectly straight
        this.d    = 50;      // wheelbase (front-to-rear axle distance)
        this.w    = 30;      // track width

        this.mass       = 1.0;   // relative mass — collision impulses split by this
        this._impactYaw = 0;     // collision-induced yaw rate (rad/frame), decays out

        this.prevX  = x;
        this.prevY  = y;
        this.prevTh = heading;

        this.colliderData = colliderData;
        this.spriteImg    = spriteImg;
    }

    /** Scaled collision rectangle from sprite bounds. Memoized — called in hot loops. */
    getColliderSize() {
        if (this._colliderSizeCache) return this._colliderSizeCache;
        if (!this.spriteImg || this.spriteImg.width <= 0) {
            return { w: this.w, h: this.d };   // sprite not loaded yet — don't cache
        }
        const drawW  = Config.TRUCK_DRAW_H * (this.spriteImg.width / this.spriteImg.height);
        const scaleX = drawW / this.colliderData.spriteW;
        const scaleY = Config.TRUCK_DRAW_H / this.colliderData.spriteH;
        this._colliderSizeCache = {
            w: this.colliderData.bounds.w * scaleX,
            h: this.colliderData.bounds.h * scaleY
        };
        return this._colliderSizeCache;
    }

    saveState() {
        this.prevX  = this.x;
        this.prevY  = this.y;
        this.prevTh = this.th;
    }

    revertState() {
        this.x  = this.prevX;
        this.y  = this.prevY;
        this.th = this.prevTh;
    }

    /**
     * Rear axle position — used by dust / tire marks.
     * Computed from speed sign: negative = reversing, so rear is in front direction.
     */
    getRearPosition() {
        const adjustedTh = this.th - Math.PI / 2;
        const fx = Math.cos(adjustedTh);
        const fy = Math.sin(adjustedTh);
        const mult = (this.speed != null && this.speed < 0) ? 1 : -1;
        return {
            x: this.x + fx * (this.d / 2) * mult,
            y: this.y + fy * (this.d / 2) * mult
        };
    }

    isReversing() {
        return this.speed != null && this.speed < 0;
    }

    draw() {
        VehicleRenderer.draw(this);
    }
}