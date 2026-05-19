/**
 * CarBehavior — crash response + health
 * Fixes: wall vibration, impact force stored for audio before damping
 */
class CarBehavior {

  static initHealth(v, maxHp = 3) {
    v.hp = v.maxHp = maxHp;
    v.lastDamageFrame = -999;
    v.damageTier = 'INTACT';
    v.lastImpactForce = 0;   // ← audio reads this instead of re-measuring after damping
  }

  static handleCrash(v, collisions, world, fc) {
    // 1. Measure force FIRST — before anything changes momentum
    const force = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
    const type  = collisions[0]?.type ?? 'building';
    const f     = force * (type === 'palm' ? 0.7 : 1.0);

    // 2. Store for audio — GameAudio reads this AFTER physics already zeroed momentum
    v.lastImpactForce = f;

    // 3. Push car out — AND zero the into-wall velocity to stop vibration
    CarBehavior._pushOut(v, collisions, world);

    // 4. Damp momentum with ground friction (no ice)
    CarBehavior._reflectAndDamp(v, f);

    // 5. Kill drive speed proportional to impact
    v.speed *= f < 5 ? 0.6 : f < 10 ? 0.3 : 0.1;

    // 6. Straighten steering
    v.phi *= 0.3;

    // 7. Damage + stun on heavy hits
    if (f >= 8 && fc - (v.lastDamageFrame ?? -999) > 90) {
      if (v.hp !== undefined) {
        v.hp = Math.max(0, v.hp - (f >= 13 ? 2 : 1));
        v.lastDamageFrame = fc;
        const r = v.hp / v.maxHp;
        v.damageTier = r <= 0 ? 'WRECKED' : r <= 0.34 ? 'DAMAGED' : r <= 0.67 ? 'DENTED' : 'INTACT';
      }
      v.spinOutUntil = Math.max(v.spinOutUntil ?? 0, fc + (f >= 13 ? 35 : 18));
    }
  }

  static isAlive(v) { return (v.hp ?? 1) > 0; }

  static _pushOut(v, collisions, world) {
    for (const hit of collisions) {
      let obs = null;
      if      (hit.type === 'building') obs = world.getBuildingCollider(hit.obj);
      else if (hit.type === 'palm')     obs = world.getPalmCollider(hit.obj);
      else if (hit.type === 'camel')    obs = { x: hit.obj.x, y: hit.obj.y };
      if (!obs) continue;

      const dx = v.x - obs.x;
      const dy = v.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;  // wall normal (pointing away from obstacle)
      const ny = dy / dist;

      // Push out 8px
      v.x += nx * 8;
      v.y += ny * 8;

      // ── FIX: cancel the momentum component driving INTO the wall ──
      // If momentum is pointing toward the wall (dot < 0), zero that component.
      // This stops the car from immediately pushing back in next frame (vibration).
      const momIntoWall = v.momentum.x * (-nx) + v.momentum.y * (-ny);
      if (momIntoWall > 0) {
        v.momentum.x += momIntoWall * nx;
        v.momentum.y += momIntoWall * ny;
      }
    }
  }

  static _reflectAndDamp(v, force) {
    const mag = Math.sqrt(v.momentum.x ** 2 + v.momentum.y ** 2);
    if (mag < 0.5) { v.momentum.x = 0; v.momentum.y = 0; return; }

    const fwdX   =  Math.sin(v.th);
    const fwdY   = -Math.cos(v.th);
    const fwdDot = v.momentum.x * fwdX + v.momentum.y * fwdY;
    const latX   = v.momentum.x - fwdDot * fwdX;
    const latY   = v.momentum.y - fwdDot * fwdY;

    const bounce  = force >= 8 ? -0.15 : -0.10;
    const latDamp = force >= 8 ?  0.15 :  0.35;

    v.momentum.x = fwdDot * bounce * fwdX + latX * latDamp;
    v.momentum.y = fwdDot * bounce * fwdY + latY * latDamp;
  }
}