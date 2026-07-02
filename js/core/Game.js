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
        this.lastPoliceCrashFrame  = 0;  // cooldown for police obstacle-crash sound
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
        }, { once: true });
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
        // Quick distance cull — full impulse resolution only if within ~200px
        const vcdx = this.player.x - this.police.x;
        const vcdy = this.player.y - this.police.y;
        if (vcdx * vcdx + vcdy * vcdy < 200 * 200) {
            const force = VehicleCollision.resolve(this.player, this.police, fc);
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

        // ── Camera ────────────────────────────────────────────────────────────
        this.camera.follow(this.player, width, height);

        // ── Visual effects (same systems for player and chase car) ───────────
        this._driveEffects(this.player);
        this._driveEffects(this.police);
        this.particles.update();

        // ── Audio ─────────────────────────────────────────────────────────────
        GameAudio.update(this);

        // ── Debug ─────────────────────────────────────────────────────────────
        this.debug.update();
    }

    /** Crash dust, tire marks, drive dust — shared by player and chase car. */
    _driveEffects(v) {
        const momMag = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);

        if (v.frameCollisions.length > 0 && (v.lastImpactForce || 0) > 1) {
            this.particles.spawnCrashDust(
                v.x, v.y, v.th, v.lastImpactForce, v.momentum, v.frameCollisions, this.world
            );
        }

        if (abs(v.phi) > 0.5 && (abs(v.speed) > 1 || momMag > 6)) {
            this.tireMarks.addMark(
                v.x + (v.d / 2) * (v.phi / abs(v.phi)) * sin((-v.phi / abs(v.phi)) * v.th),
                v.y + (v.d / 2) * cos(v.th),
                v.th
            );
        }

        if (abs(v.speed) > 0.5 || momMag > 2) {
            this.particles.spawnDust(
                v.x, v.y, v.th, v.w, v.d, v.speed, v.phi, v.momentum, v.isReversing()
            );
        }
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