/**
 * VehicleRenderer - Handles all vehicle drawing (tires, shadow, sprite)
 * Extracted from Vehicle.js for ≤100 line classes
 */
class VehicleRenderer {
    /**
     * Main draw: shadow + tires + sprite
     */
    static draw(vehicle) {
        VehicleRenderer.drawShadow(vehicle);
        push();
        translate(vehicle.x, vehicle.y);
        rotate(vehicle.th);

        if (vehicle.spriteImg && vehicle.spriteImg.width > 0) {
            VehicleRenderer.drawTires(vehicle);
            const drawH = Config.TRUCK_DRAW_H;
            const drawW = drawH * (vehicle.spriteImg.width / vehicle.spriteImg.height);
            image(vehicle.spriteImg, 0, 0, drawW, drawH);
        } else {
            fill(120, 120, 120);
            noStroke();
            rect(0, 0, vehicle.w * 1.1, vehicle.d * 1.5);
        }

        pop();
    }

    /**
     * Draw 4 tires with steering rotation on front wheels
     */
    static drawTires(vehicle) {
        const tireW = Config.TIRE_W;
        const tireH = Config.TIRE_H;
        const tireRadius = Config.TIRE_RADIUS;
        const leftX = -vehicle.w / 2 + (Config.TIRE_LEFT_INSET ?? 1);
        const rightX = vehicle.w / 2 + (Config.TIRE_RIGHT_INSET ?? 0);
        const halfD = vehicle.d / 2 - (Config.TIRE_HALFD_REDUCE ?? 3.5);
        const wheelPositions = [
            { x: leftX, y: -halfD, steer: true },
            { x: rightX, y: -halfD, steer: true },
            { x: leftX, y: halfD, steer: false },
            { x: rightX, y: halfD, steer: false }
        ];
        for (const wp of wheelPositions) {
            push();
            translate(wp.x, wp.y);
            if (wp.steer) rotate(vehicle.phi);
            noStroke();
            fill(35, 35, 40);
            rect(0, 0, tireW, tireH, tireRadius);
            fill(80, 80, 85);
            rect(0, 0, tireW * 0.6, tireH * 0.6, tireRadius * 0.5);
            pop();
        }
    }

    /**
     * Shadow: fixed offset -5px left, +5px down
     */
    static drawShadow(vehicle) {
        const shadowX = vehicle.x - 5;
        const shadowY = vehicle.y + 5;
        const drawH = Config.TRUCK_DRAW_H;
        const drawW = vehicle.spriteImg && vehicle.spriteImg.width > 0
            ? drawH * (vehicle.spriteImg.width / vehicle.spriteImg.height)
            : vehicle.w * 1.5;
        push();
        translate(shadowX, shadowY);
        rotate(vehicle.th);
        noStroke();
        if (vehicle.spriteImg && vehicle.spriteImg.width > 0) {
            tint(0, 0, 0, 85);
            image(vehicle.spriteImg, 0, 0, drawW, drawH);
            noTint();
        } else {
            fill(0, 0, 0, 85);
            rect(0, 0, vehicle.w * 1.1, vehicle.d * 1.5);
        }
        pop();
    }
}
