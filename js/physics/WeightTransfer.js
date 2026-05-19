/**
 * WeightTransfer — Shifts grip between front and rear axles.
 *
 * Braking → weight shifts forward → front grip UP, rear grip DOWN → rear slides.
 * Accelerating → weight shifts rear → rear grip UP.
 *
 * This is what makes brake-initiated drifts (J-turn, Scandi flick) possible.
 */
class WeightTransfer {

    /**
     * @param {number} longAccel  - longitudinal acceleration this frame
     * @param {number} cgFront    - CG-to-front-axle distance
     * @param {number} cgRear     - CG-to-rear-axle distance
     * @param {number} transferK  - transfer sensitivity (0–1)
     * @returns {{ front: number, rear: number }} load fractions (sum ≈ 1)
     */
    static compute(longAccel, cgFront, cgRear, transferK) {
        const wheelbase = cgFront + cgRear;
        const baseRear  = cgFront / wheelbase;  // more front CG → more static rear load
        const baseFront = 1.0 - baseRear;

        // Acceleration shifts weight opposite to direction
        const shift = longAccel * transferK;

        return {
            front: clampLoad(baseFront + shift),
            rear:  clampLoad(baseRear  - shift)
        };
    }
}

function clampLoad(v) { return Math.max(0.15, Math.min(0.85, v)); }
