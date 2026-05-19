/**
 * CamelAI - Behavior logic for camels
 * States: WALK, DODGE, FLEE, KNOCKED
 */
class CamelAI {
    /**
     * Update camel behavior based on current state
     */
    static update(camel, world, playerTruck, smugglerTruck, frameCount) {
        const isKnocked = frameCount < camel.knockedUntil;
        const isRunning = frameCount < camel.runAwayUntil;

        if (isKnocked) {
            CamelAI._applyKnocked(camel);
            return;
        }
        if (isRunning) {
            CamelAI._applyFlee(camel, world, playerTruck, smugglerTruck);
            return;
        }
        CamelAI._applyWalk(camel, world, playerTruck, smugglerTruck);
    }

    static _applyKnocked(camel) {
        camel.x += camel.vx;
        camel.y += camel.vy;
        camel.vx *= 0.95;
        camel.vy *= 0.95;
    }

    static _applyFlee(camel, world, playerTruck, smugglerTruck) {
        const lookAhead = 50;
        const futureX = camel.x + camel.runAwayVx * lookAhead;
        const futureY = camel.y + camel.runAwayVy * lookAhead;

        if (world.camelOverlapsObstacle(futureX, futureY, camel, playerTruck, smugglerTruck)) {
            camel.runAwayVy = -camel.runAwayVy;
        }
        camel.x += camel.runAwayVx;
        camel.y += camel.runAwayVy;
    }

    static _applyWalk(camel, world, playerTruck, smugglerTruck) {
        const lookAheadDistance = 50;
        const nextX = camel.x + camel.vx;
        const futureX = camel.x + camel.vx * lookAheadDistance;
        const wouldHitNow = world.camelOverlapsObstacle(nextX, camel.y, camel, playerTruck, smugglerTruck);
        const wouldHitSoon = world.camelOverlapsObstacle(futureX, camel.y, camel, playerTruck, smugglerTruck);

        if (wouldHitSoon || wouldHitNow) {
            CamelAI._dodge(camel, world, playerTruck, smugglerTruck);
        } else {
            camel.x = nextX;
            camel.dodgeDir = 0;
            camel.vx = camel.normalSpeed;
        }
    }

    static _dodge(camel, world, playerTruck, smugglerTruck) {
        if (camel.dodgeDir === undefined || camel.dodgeDir === 0) {
            camel.dodgeDir = random() > 0.5 ? 1 : -1;
        }
        const step = Config.CAMEL_DODGE_STEP;
        const upClear = !world.camelOverlapsObstacle(camel.x, camel.y - step, camel, playerTruck, smugglerTruck);
        const downClear = !world.camelOverlapsObstacle(camel.x, camel.y + step, camel, playerTruck, smugglerTruck);

        if (upClear && (camel.dodgeDir === -1 || !downClear)) {
            camel.y -= step;
        } else if (downClear && (camel.dodgeDir === 1 || !upClear)) {
            camel.y += step;
        } else if (upClear) {
            camel.y -= step;
            camel.dodgeDir = -1;
        } else if (downClear) {
            camel.y += step;
            camel.dodgeDir = 1;
        } else {
            camel.x += Math.abs(camel.normalSpeed) * 2;
            camel.y += (random() > 0.5 ? -1 : 1) * step * 0.5;
        }
    }
}
