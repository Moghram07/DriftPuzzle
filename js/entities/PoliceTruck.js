/**
 * PoliceTruck - AI-controlled police vehicle that chases the player.
 * Same physics as PlayerTruck, but input comes from PoliceAI instead of keyboard.
 */
class PoliceTruck extends Vehicle {
    constructor(x = 300, y = 300) {
        super(x, y, 0, ColliderData.POLICE_TRUCK, AssetManager.images.policeTruck);

        this.speed        = 0;
        this.momentum     = { x: 0, y: 0 };
        this.spinOutUntil = 0;

        this.vx = 0;
        this.vy = 0;

        this._yawRate        = 0;
        this._prevLongForce  = 0;
        this._slipAngleFront = 0;
        this._slipAngleRear  = 0;
        this._absSpeed       = 0;

        this.lastImpactForce    = 0;
        this.lastCollisionFrame = 0;
        this.frameCollisions    = [];
    }

    update(world, playerTruck) {
        const input = PoliceAI.getInput(this, playerTruck, world);
        this.frameCollisions = VehiclePhysics.update(this, input, world);
    }

    getForwardSpeed() {
        const fwdX = Math.sin(this.th);
        const fwdY = Math.cos(this.th);
        return this.momentum.x * fwdX + this.momentum.y * fwdY;
    }

    isReversing() {
        return this.speed < -0.1;
    }
}