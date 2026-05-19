/** Camel entity - state, animation, collision, drawing. AI via CamelAI */
class Camel {
  constructor(x, y, camelSounds = null) {
    this.x = x; this.y = y;
    this.frame = 0; this.frameTime = 0;
    this.vx = -random(0.3, 0.6); this.vy = 0;
    this.dodgeDir = 0;
    this.knockedUntil = 0; this.runAwayUntil = 0;
    this.runAwayVx = 0; this.runAwayVy = 0;
    this.normalSpeed = this.vx;
    this.camelSounds = camelSounds;
  }
  update(world, playerTruck, smugglerTruck) {
    const fc = window.frameCount || 0;
    this.frameTime += 1 / 60;
    if (this.frameTime >= 1 / Config.CAMEL_FPS) {
      this.frame = (this.frame + 1) % Config.CAMEL_FRAME_COUNT;
      this.frameTime = 0;
    }
    // Despawn only when past despawn line AND off-camera
    if (this.x < Config.CAMEL_DESPAWN_X && !this._isOnCamera(playerTruck)) {
      this._respawnOffCamera(playerTruck);
      return;
    }
    // Collision response is handled in Game.update() from player.frameCollisions,
    // which runs right after VehiclePhysics (before CollisionResponse pushes the truck away).
    // _checkCollision here would always miss — the truck is already separated by this point.
    CamelAI.update(this, world, playerTruck, smugglerTruck, fc);
  }

  /** Check if this camel is within the camera view */
  _isOnCamera(playerTruck) {
    if (!playerTruck) return false;
    const margin = 100;
    const halfW = (typeof width !== 'undefined' ? width : 1200) / 2 + margin;
    const halfH = (typeof height !== 'undefined' ? height : 800) / 2 + margin;
    const dx = Math.abs(this.x - playerTruck.x);
    const dy = Math.abs(this.y - playerTruck.y);
    return dx < halfW && dy < halfH;
  }

  /** Respawn at a position guaranteed to be off-camera */
  _respawnOffCamera(playerTruck) {
    const px = playerTruck ? playerTruck.x : 0;
    const py = playerTruck ? playerTruck.y : 0;
    const halfW = (typeof width !== 'undefined' ? width : 1200) / 2 + 200;
    const halfH = (typeof height !== 'undefined' ? height : 800) / 2 + 200;

    // Try up to 20 random positions, pick one that's off-camera
    for (let i = 0; i < 20; i++) {
      const nx = random(Config.CAMEL_RESPAWN_X_MIN, Config.CAMEL_RESPAWN_X_MAX);
      const ny = random(Config.CAMEL_RESPAWN_Y_MIN, Config.CAMEL_RESPAWN_Y_MAX);
      if (Math.abs(nx - px) > halfW || Math.abs(ny - py) > halfH) {
        this.x = nx; this.y = ny;
        this.dodgeDir = 0; this.vx = -random(0.3, 0.6); this.normalSpeed = this.vx;
        this.vy = 0; this.knockedUntil = 0; this.runAwayUntil = 0;
        return;
      }
    }
    // Fallback: spawn far to the right (always off-camera since camera follows player)
    this.x = px + halfW + 200;
    this.y = py + random(-300, 300);
    this.dodgeDir = 0; this.vx = -random(0.3, 0.6); this.normalSpeed = this.vx;
    this.vy = 0; this.knockedUntil = 0; this.runAwayUntil = 0;
  }
  _checkCollision(truck) {
    const cc = this.getCollider();
    const cs = truck.getColliderSize();
    const dx = this.x - truck.x, dy = this.y - truck.y;
    if (dx * dx + dy * dy > 10000) return false;
    if (typeof CollisionPhysics !== 'undefined') {
      return CollisionPhysics.rectWithRotatedRect(cc.x, cc.y, cc.w, cc.h, truck.x, truck.y, cs.w, cs.h, truck.th);
    }
    return Math.sqrt(dx * dx + dy * dy) < 50;
  }
  handleCarCollision(truck, fc) {
    const spd = Math.sqrt(truck.momentum.x ** 2 + truck.momentum.y ** 2);
    const dx = this.x - truck.x, dy = this.y - truck.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = dx / dist, py = dy / dist;
    let state = 'normal';
    if (spd > 4) {
      state = 'angry';
      this.x += px * 30; this.y += py * 30;
      this.vx = px * 3; this.vy = py * 3;
      this.knockedUntil = fc + 20;
      this.runAwayVx = px * 1.5; this.runAwayVy = py * 1.5;
      this.runAwayUntil = fc + 180;
    } else if (spd > 2) {
      state = 'agitated';
      this.x += px * 15; this.y += py * 15;
      this.vx = this.normalSpeed * 2;
      this.runAwayVx = px; this.runAwayVy = py;
      this.runAwayUntil = fc + 90;
    } else {
      this.y += Math.sign(dy) * 10; this.dodgeDir = Math.sign(dy);
    }
    if (this.camelSounds) { this.camelSounds.play(state, spd); }
    else if (typeof game !== 'undefined' && game?.audioManager?.playCamelSound) {
      game.audioManager.playCamelSound(state, spd);
    }
  }
  getCollider() {
    const c = ColliderData.CAMEL;
    const img = AssetManager.images.camel;
    if (!c || !img || img.width <= 0) return { x: this.x, y: this.y, w: 30, h: 20 };
    const ws = Config.TRUCK_DRAW_H / ColliderData.TRUCK.spriteH;
    const fw = img.width / Config.CAMEL_FRAME_COUNT;
    const dw = fw * ws, dh = img.height * ws;
    const sx = dw / c.spriteW, sy = dh / c.spriteH;
    return {
      x: this.x + (c.bounds.x + c.bounds.w / 2 - c.spriteW / 2) * sx,
      y: this.y + (c.bounds.y + c.bounds.h / 2 - c.spriteH / 2) * sy,
      w: c.bounds.w * sx, h: c.bounds.h * sy
    };
  }
  draw(world) {
    const img = AssetManager.images.camel;
    const shadow = AssetManager.images.camelShadow;
    const size = world.getCamelDrawSize();
    if (img && img.width > 0) {
      const fw = img.width / Config.CAMEL_FRAME_COUNT;
      push(); translate(this.x, this.y);
      if (shadow && shadow.width > 0) {
        const sfw = shadow.width / Config.CAMEL_FRAME_COUNT;
        image(shadow, 0, 0, size.w, size.h, this.frame * sfw, 0, sfw, shadow.height);
      }
      image(img, 0, 0, size.w, size.h, this.frame * fw, 0, fw, img.height);
      pop();
    } else {
      fill(180, 140, 100); ellipse(this.x, this.y, 30, 25);
    }
  }
}