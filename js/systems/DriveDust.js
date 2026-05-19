/**
 * DriveDust - Spawns tyre/driving dust particles
 * Called every frame while car is moving. Pushes into a shared array.
 */
class DriveDust {
  static spawn(particles, carCenterX, carCenterY, carTh, carW, carD, speed, phi, momentum, isReversing) {
    const isDrifting = Math.abs(phi) > 0.3;
    let rear, front;

    if (isDrifting) {
      const total = floor(map(min(abs(speed) * 2 + abs(phi) * 3, 6), 0, 6, 0, 20));
      rear = front = floor(total * 0.5);
    } else if (isReversing) {
      const total = floor(map(min(abs(speed) * 2, 6), 0, 6, 0, 16));
      front = floor(total * 0.7); rear = floor(total * 0.3);
    } else {
      const total = floor(map(min(abs(speed) * 2, 6), 0, 6, 0, 16));
      rear = floor(total * 0.7); front = floor(total * 0.3);
    }

    const halfD = carD / 2 - 3.5;
    const backX = isReversing ? sin(carTh) : -sin(carTh);
    const backY = isReversing ? -cos(carTh) : cos(carTh);

    DriveDust._emit(particles, rear,  carCenterX, carCenterY, carTh, carW,  halfD, backX, backY, momentum, 1.0);
    DriveDust._emit(particles, front, carCenterX, carCenterY, carTh, carW, -halfD, backX, backY, momentum, 0.8);
  }

  static _emit(particles, count, cx, cy, th, carW, localY, backX, backY, momentum, scale) {
    for (let n = 0; n < count; n++) {
      const lx = random(-carW / 2, carW / 2);
      const ly = localY + random(-5, 5);
      particles.push({
        type:  'drive',
        x:     cx + lx * cos(th) - ly * sin(th),
        y:     cy + lx * sin(th) + ly * cos(th),
        vx:    backX * 0.8 + random(-0.5, 0.5) + momentum.x * 0.1,
        vy:    backY * 0.8 + random(-0.5, 0.5) - momentum.y * 0.1,
        size:  random(Config.DUST_SIZE_MIN, Config.DUST_SIZE_MAX) * scale,
        alpha: random(Config.DUST_ALPHA_MIN, Config.DUST_ALPHA_MAX) * scale,
        life:  1
      });
    }
  }

  static draw(particles) {
    noStroke();
    for (const p of particles) {
      if (p.type !== 'drive') continue;
      fill(254, 217, 162, p.alpha * p.life);
      ellipse(p.x, p.y, p.size, p.size * 0.7);
    }
  }
}