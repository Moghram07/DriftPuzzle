/**
 * CrashDust - Spawns impact dust burst scaled to crash severity
 *
 * ── TUNING ──────────────────────────────────────────────────────────
 * Edit these 4 numbers to adjust dust per severity:
 *   scrape = force < 3   (light graze)
 *   hit    = force 3–7   (medium hit)
 *   crash  = force 7–12  (hard crash)
 *   wreck  = force 12+   (full speed impact)
 */
class CrashDust {
  static get COUNTS() {
    return { scrape: 3, hit: 7, crash: 12, wreck: 18 };
  }

  static spawn(particles, x, y, th, force, momentum, collisions, world) {
    const { spawnX, spawnY } = CrashDust._contactPoint(x, y, collisions, world);
    const { count, sizeMult } = CrashDust._severity(force);
    const { baseAng, spread } = CrashDust._burstDir(th, force, momentum);

    for (let i = 0; i < count; i++) {
      const angle   = baseAng + random(-spread, spread);
      const speed   = random(0.6, 1.8 + force * 0.15);
      const offsetR = random(0, 6 + force * 0.8);
      const offsetA = random(0, Math.PI * 2);
      particles.push({
        type:      'crash',
        x:         spawnX + Math.cos(offsetA) * offsetR,
        y:         spawnY + Math.sin(offsetA) * offsetR,
        vx:        Math.cos(angle) * speed,
        vy:        Math.sin(angle) * speed,
        size:      random(Config.DUST_SIZE_MIN, Config.DUST_SIZE_MAX) * sizeMult,
        alpha:     random(Config.DUST_ALPHA_MIN, Config.DUST_ALPHA_MAX),
        life:      1,
        lifeDecay: random(0.005, 0.010)
      });
    }
  }

  static _contactPoint(x, y, collisions, world) {
    if (collisions && collisions.length > 0 && world) {
      const hit = collisions[0];
      let obs = null;
      if      (hit.type === 'building') obs = world.getBuildingCollider(hit.obj);
      else if (hit.type === 'palm')     obs = world.getPalmCollider(hit.obj);
      else if (hit.type === 'camel')    obs = { x: hit.obj.x, y: hit.obj.y };
      if (obs) {
        const dx = x - obs.x, dy = y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return { spawnX: x - (dx / dist) * 28, spawnY: y - (dy / dist) * 28 };
      }
    }
    return { spawnX: x, spawnY: y };
  }

  static _severity(force) {
    const C = CrashDust.COUNTS;
    if      (force < 3)  return { count: C.scrape, sizeMult: 1.2 };
    else if (force < 7)  return { count: C.hit,    sizeMult: 1.8 };
    else if (force < 12) return { count: C.crash,  sizeMult: 2.4 };
    else                 return { count: C.wreck,  sizeMult: 3.0 };
  }

  static _burstDir(th, force, momentum) {
    const mag = Math.sqrt(momentum.x ** 2 + momentum.y ** 2);
    const bx  = mag > 0.1 ? -(momentum.x / mag) : Math.cos(th);
    const by  = mag > 0.1 ?  (momentum.y / mag) : Math.sin(th);
    return { baseAng: Math.atan2(by, bx), spread: map(force, 0, 15, 0.6, Math.PI * 0.8) };
  }

  static draw(particles) {
    noStroke();
    for (const p of particles) {
      if (p.type !== 'crash') continue;
      const a = p.alpha * p.life;
      fill(254, 217, 162, a * 0.30); ellipse(p.x, p.y, p.size * 1.4, p.size * 1.1);
      fill(254, 217, 162, a * 0.55); ellipse(p.x, p.y, p.size * 0.9, p.size * 0.75);
      fill(254, 217, 162, a * 0.75); ellipse(p.x, p.y, p.size * 0.45, p.size * 0.38);
    }
  }
}