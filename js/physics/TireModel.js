/**
 * TireModel — Pure math for one tire/axle.
 *
 * Two jobs:
 *   1. Compute slip angle from velocity + steer angle
 *   2. Compute lateral force from slip angle (saturating curve)
 */
class TireModel {

    /**
     * Slip angle at one axle.
     * @param {number} vLat     - lateral velocity at this axle (px/f)
     * @param {number} vLong    - longitudinal velocity (px/f)
     * @param {number} steerAngle - wheel angle (rad), 0 for rear
     * @returns {number} slip angle in radians
     */
    static slipAngle(vLat, vLong, steerAngle = 0) {
        const guard = Math.max(Math.abs(vLong), 0.5);
        return Math.atan2(vLat, guard) - steerAngle * Math.sign(vLong || 1);
    }

    /**
     * Lateral force from slip angle — smooth saturating curve.
     *
     *   force
     *    |      ┌──── gripMax (saturation = sliding)
     *    |     /
     *    |    /
     *    |   / ← stiffness (grip zone)
     *    |  /
     *    └──────── slip angle
     *
     * Uses atan for smooth S-curve (simplified Pacejka).
     *
     * @param {number} slip      - slip angle (rad)
     * @param {number} stiffness - cornering stiffness (accel per rad)
     * @param {number} gripMax   - max lateral accel (saturation cap)
     * @returns {number} lateral acceleration (px/frame²)
     */
    static lateralForce(slip, stiffness, gripMax) {
        const raw = stiffness * slip;
        return gripMax * (2 / Math.PI) * Math.atan((Math.PI / 2) * raw / gripMax);
    }
}
