/**
 * PlayerTruck — Player-controlled truck.
 * Delegates: input → VehicleInput, physics → VehiclePhysics.
 */
class PlayerTruck extends Vehicle {
    constructor(x = 0, y = 0) {
        super(x, y, 0, ColliderData.TRUCK, AssetManager.images.truck);

        this.speed        = 1;
        this.momentum     = { x: 0, y: 0 };
        this.spinOutUntil = 0;
        this.phi          = 0.01;  // never exactly 0

        // Published velocity (after physics tick)
        this.vx = 0;
        this.vy = 0;

        // State for effects/audio
        this._driftAngle     = 0;
        this._absSpeed       = 0;

        // Collision tracking
        this.lastImpactForce    = 0;
        this.lastCollisionFrame = 0;
        this.frameCollisions    = [];
    }

    update(world, smugglerTruck = null) {
        const input = VehicleInput.getState();
        this.frameCollisions = VehiclePhysics.update(this, input, world, smugglerTruck);
    }

    getForwardSpeed() {
        return this.momentum.x * Math.sin(this.th) + this.momentum.y * Math.cos(this.th);
    }

    getLateralSpeed() {
        return this.momentum.x * Math.cos(this.th) + this.momentum.y * (-Math.sin(this.th));
    }

    isDrifting() {
        return Math.abs(this._driftAngle || 0) > 0.15 && this._absSpeed > 2;
    }

    getDriftAngle() {
        if (this._absSpeed < 0.5) return 0;
        const velAngle = Math.atan2(this.momentum.x, this.momentum.y);
        let drift = this.th - velAngle;
        while (drift > Math.PI) drift -= 2 * Math.PI;
        while (drift < -Math.PI) drift += 2 * Math.PI;
        return drift;
    }

    isReversing() {
        return this.speed < -0.1;
    }
}