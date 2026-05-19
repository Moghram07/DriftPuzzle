/**
 * VehicleInput - Reads keyboard state and returns normalized input.
 * 
 * Controls:
 *   W / ↑       = throttle forward
 *   S / ↓       = brake / reverse
 *   A / ←       = steer left
 *   D / →       = steer right
 *   Space        = handbrake (locks rear wheels for drift initiation)
 */
class VehicleInput {
    /**
     * Returns the current input state.
     * @returns {{ throttle: number, steer: number, handbrake: boolean }}
     *   throttle:  1 = forward, -1 = brake/reverse, 0 = coast
     *   steer:     1 = right, -1 = left, 0 = straight
     *   handbrake: true = spacebar held
     */
    static getState() {
        let throttle = 0;
        let steer    = 0;
        let handbrake = false;

        // p5.js keyIsDown() — uses key codes
        if (typeof keyIsDown === 'function') {
            if (keyIsDown(87) || keyIsDown(UP_ARROW))    throttle =  1;  // W or ↑
            if (keyIsDown(83) || keyIsDown(DOWN_ARROW))   throttle = -1;  // S or ↓
            if (keyIsDown(68) || keyIsDown(RIGHT_ARROW))  steer    =  1;  // D or →
            if (keyIsDown(65) || keyIsDown(LEFT_ARROW))   steer    = -1;  // A or ←
            if (keyIsDown(32))                            handbrake = true; // Space
        }

        return { throttle, steer, handbrake };
    }
}