/**
 * TestWorld — Empty desert, no buildings/palms/camels.
 */
class TestWorld {
    constructor() {
        this.buildings = [];
        this.palms = [];
        this.camels = [];
    }
    vehicleCollides() { return false; }
    getCollisions()   { return []; }
    getBuildingCollider() { return { x:0, y:0, w:0, h:0 }; }
    getPalmCollider()    { return { x:0, y:0, w:0, h:0 }; }
}   