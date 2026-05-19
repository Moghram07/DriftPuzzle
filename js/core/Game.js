/**
 * Game - Top-level orchestrator. Creates and connects all systems.
 * Delegates: rendering → GameRenderer, audio → GameAudio, physics → VehiclePhysics.
 */
class Game {
    constructor() {
        this.world          = null;
        this.player         = null;
        this.police         = null;
        this.camera         = null;
        this.particles      = null;
        this.tireMarks      = null;
        this.debug          = null;
        this.audioManager   = null;
        this.audioInitialized = false;   // guard against double-init on rapid keydown
        this.lastCrashFrame = 0;
        this.lastVehicleCrashFrame = 0;  // cooldown for vehicle-vehicle crash sound
    }

    async init() {
        this.world      = new World();
        this.player     = new PlayerTruck(0, 0);
        this.police     = new PoliceTruck(300, 300);
        this.camera     = new Camera(0.08);
        this.particles  = new ParticleSystem();
        this.tireMarks  = new TireMarks();
        this.debug      = new Debug();
        this.world.initCamels(5);
        this._initAudio();
        console.log('✅ Game initialized');
    }

    _initAudio() {
        if (typeof AudioManager === 'undefined' || !Config.AUDIO_ENABLED) return;
        console.log('ℹ️ Audio ready — press any key to start');
        window.addEventListener('keydown', async () => {
            if (this.audioInitialized) return;
            this.audioInitialized = true;
            try {
                this.audioManager = new AudioManager(Config);
                await this.audioManager.init();
                console.log('✅ Audio started');
            } catch (err) {
                console.error('❌ Audio error:', err);
                this.audioManager = null;
            }
        });
    }

    update() {
        // ── Physics ───────────────────────────────────────────────────────────
        this.player.update(this.world, null);

        // Camel collision response: read frameCollisions BEFORE the truck gets pushed
        // further away. Camel._checkCollision() runs too late (after CollisionResponse
        // has already separated the vehicles), so this is the reliable trigger point.
        const fc = window.frameCount || 0;
        for (const hit of this.player.frameCollisions) {
            if (hit.type === 'camel') hit.obj.handleCarCollision(this.player, fc);
        }

        this.police.update(this.world, this.player);
        for (const camel of this.world.camels) {
            camel.update(this.world, this.player, null);
        }

        // ── Vehicle-to-vehicle collision ──────────────────────────────────────
        // Quick distance cull — OBB check only if trucks are within ~200px
        const vcdx = this.player.x - this.police.x;
        const vcdy = this.player.y - this.police.y;
        if (vcdx * vcdx + vcdy * vcdy < 200 * 200) {
            const pSize   = this.player.getColliderSize();
            const polSize = this.police.getColliderSize();
            if (SATDetection.obbVsObb(
                this.player.x, this.player.y, pSize.w,   pSize.h,   this.player.th,
                this.police.x, this.police.y, polSize.w, polSize.h, this.police.th
            )) {
                const force = this._resolveVehicleCollision(this.player, this.police);
                if (force > 1 && (fc - this.lastVehicleCrashFrame) > 30) {
                    this.lastVehicleCrashFrame = fc;
                    if (this.audioManager) this.audioManager.playCrashSound(force);
                    this.particles.spawnCrashDust(
                        (this.player.x + this.police.x) / 2,
                        (this.player.y + this.police.y) / 2,
                        this.player.th, force, this.player.momentum, [], this.world
                    );
                }
            }
        }

        // ── Camera ────────────────────────────────────────────────────────────
        this.camera.follow(this.player, width, height);

        // ── Visual effects ────────────────────────────────────────────────────
        const p      = this.player;
        const momMag = Math.sqrt(p.momentum.x ** 2 + p.momentum.y ** 2);

        if (p.frameCollisions.length > 0 && (p.lastImpactForce || 0) > 1) {
            this.particles.spawnCrashDust(
                p.x, p.y, p.th, p.lastImpactForce, p.momentum, p.frameCollisions, this.world
            );
        }

        if (abs(p.phi) > 0.5 && (abs(p.speed) > 1 || momMag > 6)) {
            this.tireMarks.addMark(
                p.x + (p.d / 2) * (p.phi / abs(p.phi)) * sin((-p.phi / abs(p.phi)) * p.th),
                p.y + (p.d / 2) * cos(p.th),
                p.th
            );
        }

        if (abs(p.speed) > 0.5 || momMag > 2) {
            this.particles.spawnDust(
                p.x, p.y, p.th, p.w, p.d, p.speed, p.phi, p.momentum, p.isReversing()
            );
        }

        this.particles.update();

        // ── Audio ─────────────────────────────────────────────────────────────
        this.lastCrashFrame = GameAudio.update(this.player, this.audioManager, this.lastCrashFrame);

        // ── Debug ─────────────────────────────────────────────────────────────
        this.debug.update();
    }

    /**
     * Resolve a collision between two vehicles.
     * Pushes them apart, exchanges momentum along the collision normal,
     * and damps drive speed. Returns the impact force (for audio/particles).
     */
    _resolveVehicleCollision(a, b) {
        // Collision normal: vector from b's center to a's center
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push both apart so they no longer overlap
        a.x += nx * 5;  a.y += ny * 5;
        b.x -= nx * 5;  b.y -= ny * 5;

        // Relative closing velocity along the normal
        const relVx  = a.momentum.x - b.momentum.x;
        const relVy  = a.momentum.y - b.momentum.y;
        const relVelN = relVx * nx + relVy * ny;

        if (relVelN > 0) return 0;  // already separating — no impulse needed

        // Impulse for equal-mass elastic-ish collision (restitution 0.25)
        const impulse = -(1 + 0.25) * relVelN / 2;

        a.momentum.x += impulse * nx;  a.momentum.y += impulse * ny;
        b.momentum.x -= impulse * nx;  b.momentum.y -= impulse * ny;

        // Damp drive speed — harder hit = more damping
        const damp = impulse > 2 ? 0.5 : 0.75;
        a.speed *= damp;
        b.speed *= damp;

        const force = impulse * 2;
        a.lastImpactForce = force;
        b.lastImpactForce = force;
        return force;
    }

    draw() {
        GameRenderer.draw(this);
    }
}

// ── p5.js entry points ────────────────────────────────────────────────────────
let game = null;
function preload() { AssetManager.preload(); }
async function setup() {
    createCanvas(900, 600);
    rectMode(CENTER);
    imageMode(CENTER);
    game = new Game();
    await game.init();
}
function draw() {
    if (game) { game.update(); game.draw(); }
}