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

    // ── Vehicle-vs-vehicle collision (VehicleCollision.js) ───────────────────
    // Rigid-body impulse model. Restitution scales with closing speed:
    // slow contact = soft push, fast crash = real bounce.
    VC_RESTITUTION_MIN:   0.06,   // restitution floor (gentle contact)
    VC_RESTITUTION_MAX:   0.38,   // restitution cap (violent crash)
    VC_FRICTION:          0.65,   // tire scrub friction at the contact (Coulomb μ)
    VC_INERTIA:           900,    // yaw inertia — higher = harder to spin a truck
    VC_MAX_IMPACT_YAW:    0.32,   // cap on collision-induced yaw rate (rad/frame)
    VC_YAW_DECAY:         0.90,   // per-frame decay of collision yaw (ground grip recovering)
    VC_SIDE_SPIN_IMPULSE: 16,     // side-impact Δv that breaks traction (spin-out)
    VC_SEPARATION_SLOP:   0.5,    // allowed overlap before positional correction (px)

    // ── Police AI (PoliceAI.js) ───────────────────────────────────────────────
    // The AI models its own physics: braking distance D = K1·speed² + K2·momentum
    // (calibrated ≈350px from full speed), steady-state min turn radius ≈130px.
    AI_LOOK_BUFFER:       60,     // px added to braking distance for ray length
    AI_LOOK_MIN:          170,    // px minimum lookahead — a slow car must not be blind
    AI_MARGIN_BASE:       14,     // px wall margin at standstill
    AI_MARGIN_SPEED_K:    3.0,    // extra margin px per px/frame of path speed
    AI_NUM_RAYS:          9,
    AI_RAY_SPREAD:        Math.PI * 0.75,
    AI_RAY_STEPS:         10,
    AI_ALIGN_WEIGHT:      0.4,    // ray score: alignment vs clearance weight
    AI_MIN_RADIUS:        130,    // steady-state min turn radius (px)
    AI_CORNER_MIN_SPEED:  1.6,    // never slow below this for a corner
    AI_BRAKE_K1:          8.5,    // braking-distance fit: K1·speed²
    AI_BRAKE_K2:          1.6,    // braking-distance fit: K2·momentum
    AI_LEAD_MAX_T:        45,     // frames of player-velocity extrapolation cap
    AI_STEER_KP:          6.0,    // steer = clamp(KP·(phiDesired − phi))
    AI_STEER_HORIZON:     12,     // frames to close the heading error
    AI_STUCK_WINDOW:      25,     // low-displacement frames before recovery
    AI_STUCK_SPEED:       0.35,   // avg px/frame below which "not moving"
    AI_RECOVER_MIN:       15,     // min recovery frames (anti-oscillation)
    AI_RECOVER_MAX:       90,     // hard cap on recovery duration
    AI_RECOVER_COOLDOWN:  20,     // frames before recovery can retrigger
    AI_RECOVER_CLEAR:     80,     // forward clearance px required to exit recovery
    AI_DRIFT_ANGLE_MIN:   1.0,    // rad heading error to trigger drift-turn
    AI_DRIFT_SPEED_MIN:   9.0,    // path speed px/frame to trigger drift-turn
    AI_DRIFT_TIMEOUT:     45,     // frames before drift-turn aborts
    AI_CONTACT_RANGE:     80,     // px: within this, match player speed + overspeed
    AI_CONTACT_OVERSPEED: 1.0,

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