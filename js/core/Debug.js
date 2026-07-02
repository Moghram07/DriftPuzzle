/**
 * Debug system - toggleable diagnostics overlay
 * Press 'D' to toggle
 */
class Debug {
  constructor() {
    this.enabled = false;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'd') {
        this.enabled = !this.enabled;
        console.log(`🔍 Debug ${this.enabled ? 'ON' : 'OFF'}`);
      }
    });
  }

  update() {
    if (!this.enabled) return;
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /** HUD stats — call OUTSIDE camera transform (screen-space). */
  drawHUD(game) {
    if (!this.enabled) return;
    fill(255, 255, 0);
    textSize(14);
    noStroke();
    let y = 30;
    text(`FPS: ${Math.round(this.fps)}`, 20, y); y += 20;
    if (game.player) {
      const p = game.player;
      const mom = Math.sqrt(p.momentum.x ** 2 + p.momentum.y ** 2);
      text(`Speed: ${Math.abs(p.speed).toFixed(1)}`, 20, y); y += 20;
      text(`Mom: ${mom.toFixed(1)}`, 20, y); y += 20;
      text(`Steer: ${p.phi.toFixed(2)}`, 20, y); y += 20;
      text(`Spin: ${p.spinOutUntil > (window.frameCount || 0) ? 'YES' : 'no'}`, 20, y); y += 25;
    }
    if (game.police && game.police._ai) {
      const ai = game.police._ai;
      fill(120, 200, 255);
      text(`AI: ${ai.state}  vT=${ai.vTarget.toFixed(1)}  spd=${Math.abs(game.police.speed).toFixed(1)}`, 20, y); y += 20;
    }
  }

  /** Collider outlines — call INSIDE camera transform (world-space). */
  draw(game) {
    if (!this.enabled) return;
    Debug._drawColliders(game);
    Debug._drawAI(game);
  }

  /** Police AI internals: aim point, ray fan, chosen direction. */
  static _drawAI(game) {
    const police = game.police;
    if (!police || !police._ai) return;
    const ai = police._ai;

    strokeWeight(2);
    for (const r of ai.rays) {
      const rx = Math.sin(r.angle), ry = -Math.cos(r.angle);
      stroke(r.chosen ? color(0, 255, 80, 220) : color(160, 160, 160, 90));
      line(police.x, police.y, police.x + rx * r.clear, police.y + ry * r.clear);
    }
    if (ai.aim) {
      stroke(255, 0, 255, 200);
      line(police.x, police.y, ai.aim.x, ai.aim.y);
      noFill();
      circle(ai.aim.x, ai.aim.y, 14);
    }
    noStroke();
  }

  static _drawColliders(game) {
    noFill();
    strokeWeight(2);
    if (game.player) {
      const size = game.player.getColliderSize();
      stroke(255, 0, 0, 200);
      push(); translate(game.player.x, game.player.y); rotate(game.player.th);
      rect(0, 0, size.w, size.h); pop();
    }
    for (const camel of game.world.camels) {
      const c = camel.getCollider();
      stroke(0, 255, 0, 200); rect(c.x, c.y, c.w, c.h);
    }
    for (const b of game.world.buildings) {
      const bc = game.world.getBuildingCollider(b);
      stroke(0, 0, 255, 150); rect(bc.x, bc.y, bc.w, bc.h);
    }
    for (const p of game.world.palms) {
      const pc = game.world.getPalmCollider(p);
      stroke(255, 165, 0, 150); rect(pc.x, pc.y, pc.w, pc.h);
    }
    noStroke();
  }
}