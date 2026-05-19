/**
 * ParticleSystem - Owns the particle array, delegates to DriveDust / CrashDust.
 * Thin coordinator: update loop + draw calls only.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Drive dust — called every frame while moving
  spawnDust(cx, cy, th, carW, carD, speed, phi, momentum, isReversing) {
    DriveDust.spawn(this.particles, cx, cy, th, carW, carD, speed, phi, momentum, isReversing);
  }

  // Crash dust — called once per collision
  spawnCrashDust(x, y, th, force, momentum, collisions, world) {
    CrashDust.spawn(this.particles, x, y, th, force, momentum, collisions, world);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.92; p.vy *= 0.92;
      p.life -= p.lifeDecay ?? Config.DUST_LIFE_DECAY;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // Called BEFORE entities — drive dust sits under car/buildings
  drawDrive() { DriveDust.draw(this.particles); }

  // Called AFTER entities — crash dust billows over everything
  drawCrash() { CrashDust.draw(this.particles); }

  // Legacy fallback
  draw() { this.drawDrive(); }
}