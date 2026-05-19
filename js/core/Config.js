/**
 * Config - All tunable constants.
 *
 * PHYSICS MODEL: Bicycle model with front/rear tire slip angles.
 * The car is modeled as a rigid body with two axles. Each axle generates
 * a lateral force based on its slip angle (difference between tire heading
 * and velocity direction). When rear slip exceeds grip, the car drifts.
 *
 * TUNING GUIDE:
 *   - More drift: lower REAR_GRIP_MAX, lower REAR_GRIP_COEFF
 *   - Less drift: raise REAR_GRIP_MAX, raise REAR_GRIP_COEFF
 *   - Easier J-turn: raise WEIGHT_TRANSFER_FACTOR, lower REAR_GRIP_MAX
 *   - Snappier steering: raise STEER_RATE, lower STEER_SPEED_FACTOR
 *   - More handbrake slide: lower HANDBRAKE_REAR_GRIP_MULT
 */
const Config = {
    // ── Rendering ─────────────────────────────────────────────────────────────
    BG_TILE_SIZE:    400,
    TRUCK_DRAW_H:    75,
    LIGHT_DIR:       { x: -1, y: -0.4 },
    SHADOW_DISTANCE: 10,

    // ── Camel ─────────────────────────────────────────────────────────────────
    CAMEL_FRAME_COUNT:   4,
    CAMEL_FPS:           7,
    CAMEL_DODGE_STEP:    0.6,
    CAMEL_RESPAWN_X_MIN: 600,
    CAMEL_RESPAWN_X_MAX: 1200,
    CAMEL_RESPAWN_Y_MIN: -800,
    CAMEL_RESPAWN_Y_MAX: 800,
    CAMEL_DESPAWN_X:     -1300,

    // ── Vehicle Dimensions ────────────────────────────────────────────────────
    // Wheelbase and track width are on Vehicle.js (d=50, w=30).
    // CG_TO_FRONT / CG_TO_REAR define weight distribution.
    // Sum should equal wheelbase (d). Front-biased = understeery, rear-biased = oversteery.
    CG_TO_FRONT: 22,   // distance from center of gravity to front axle
    CG_TO_REAR:  28,   // distance from center of gravity to rear axle (longer = more oversteer)

    // ── Engine ────────────────────────────────────────────────────────────────
    ENGINE_FORCE:     3800,   // forward force at full throttle (Newtons-ish)
    BRAKE_FORCE:      5500,   // braking force
    REVERSE_FORCE:    2000,   // reverse gear force
    MAX_SPEED:        6,      // speed cap (px/frame)
    REVERSE_MAX:      6,      // reverse speed cap
    COAST_DRAG:       0.98,   // multiplicative drag when no input
    ROLLING_RESIST:   80,     // constant rolling resistance force

    // ── Mass ──────────────────────────────────────────────────────────────────
    MASS:           1200,     // vehicle mass (kg-ish, used for F=ma)
    INERTIA:        1400,     // rotational inertia (kg·m²-ish, resists spin)

    // ── Tire Grip (the heart of drifting) ─────────────────────────────────────
    // Each axle generates lateral force = GRIP_COEFF * slip_angle, capped at GRIP_MAX.
    // When force hits the cap, the tire "saturates" and slides. That's drifting.
    //
    // Front tires: high grip = responsive steering.
    // Rear tires:  lower grip = tail breaks loose under hard cornering/throttle.
    FRONT_GRIP_COEFF: 65000,   // cornering stiffness, front (N/rad)
    FRONT_GRIP_MAX:   5200,    // max lateral force, front (N)
    REAR_GRIP_COEFF:  58000,   // cornering stiffness, rear
    REAR_GRIP_MAX:    4600,    // max lateral force, rear — LOWER = MORE DRIFT

    // ── Weight Transfer ───────────────────────────────────────────────────────
    // Braking shifts weight forward → front grip up, rear grip down → rear slides.
    // Acceleration shifts weight back → rear grip up.
    // This enables: J-turn (brake hard + steer), Scandinavian flick (steer-countersteer-brake).
    WEIGHT_TRANSFER_FACTOR: 0.00035,  // how much accel/brake shifts grip between axles

    // ── Handbrake ─────────────────────────────────────────────────────────────
    // Locks rear wheels → almost zero rear lateral grip → instant oversteer/spin.
    HANDBRAKE_REAR_GRIP_MULT: 0.08,   // multiply rear grip by this when handbrake held
    HANDBRAKE_LONG_FORCE:     3000,    // longitudinal braking force from handbrake

    // ── Steering ──────────────────────────────────────────────────────────────
    STEER_RATE:          0.055,  // rad/frame at standstill
    STEER_SPEED_FACTOR:  0.45,   // how much speed reduces steer rate (0-1)
    STEER_MAX_ANGLE:     Math.PI / 3.2,  // max front wheel angle (~56°)
    STEER_RETURN_RATE:   0.88,   // how fast wheels center when not steering
    STEER_LOCK_SPEED:    0.08,   // minimum speed to allow steering

    // ── Spin-out ──────────────────────────────────────────────────────────────
    SPIN_OUT_ENABLED:            true,
    SPIN_OUT_YAW_RATE_THRESHOLD: 0.12,   // rad/frame yaw rate to trigger spin-out
    SPIN_OUT_SPEED_THRESHOLD:    5.0,
    SPIN_OUT_DURATION:           25,      // frames

    // ── Tires (rendering) ─────────────────────────────────────────────────────
    TIRE_W:            10,
    TIRE_H:            14,
    TIRE_RADIUS:       3,
    TIRE_LEFT_INSET:   1,
    TIRE_RIGHT_INSET:  0,
    TIRE_HALFD_REDUCE: 3.5,

    // ── Particles & tire marks ────────────────────────────────────────────────
    TRACK_FADE:      110,
    DUST_ALPHA_MIN:  100,
    DUST_ALPHA_MAX:  180,
    DUST_SIZE_MIN:   4,
    DUST_SIZE_MAX:   10,
    DUST_LIFE_DECAY: 0.012,
    DUST_MAX_COUNT:  180,
    TRACK_MAX_COUNT: 250,
    DRIFT_MARK_SLIP_THRESHOLD: 0.25, // lateral slip ratio to start leaving marks

    // ── Audio ─────────────────────────────────────────────────────────────────
    AUDIO_ENABLED:  true,
    ENGINE_VOLUME:  0.25,
    DRIFT_VOLUME:   0.25,
    CRASH_VOLUME:   0.25,
    CAMEL_VOLUME:   0.3,

    // ── Legacy compat (kept so other files don't break) ───────────────────────
    FRICTION_LONG:  0.992,
    GRIP_LAT_HIGH:  0.08,
    GRIP_LAT_LOW:   0.50,
    MOMENTUM:       1,
    STEER_BASE:              0.06,
    STEER_SPEED_SENSITIVITY: 0.50,
    STEER_MAX_PHI_REDUCTION: 0.30,
    POWER_STEERING:          true,
    SPIN_OUT_THRESHOLD:          0.9,
    SPIN_OUT_MOMENTUM_THRESHOLD: 6.0,

    // ── Ackermann physics (used by new VehiclePhysics/VehicleDynamics) ───────
    ACCEL:           1.0,
    DRIFT:           1.0,
    FRICTION:        0.990,
    REVERSE_SPEED:   6,

    _FWD_ACCEL:      0.09,
    _REV_ACCEL:      0.09,
    _STEER_RATE:     0.04,
    _STEER_MAX:      Math.PI / 4,   // ~45°
    _STEER_RETURN:   0.92,
    _HEADING_DAMP:   0.20,

    _MOM_ACCUM:      10,
    _MOM_APPLY:      5,
    _MOM_DECAY:      0.99,
    _REV_MOM_BRAKE:  0.90,

    _REV_POS_MULT:   1.5,
    _REV_TURN_MULT:  1.2,
    _REV_SPEED_DAMP: 0.15,
};