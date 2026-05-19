/**
Tire mark trails
*/
class TireMarks {
  constructor() {
    this.tracks = [];
  }
  
  addMark(x, y, th) {
    this.tracks.push([x, y, th]);
    if (this.tracks.length > Config.TRACK_MAX_COUNT) {
      this.tracks.shift();
    }
  }
  
  draw(vehicle) {
    noStroke();
    for (let i = 0; i < this.tracks.length; i++) {
      const t = this.tracks[i];
      const tx = t[0];
      const ty = t[1];
      const th = t[2];
      const lx = tx - (vehicle.w / 2) * cos(th);
      const ly = ty - (vehicle.w / 2) * sin(th);
      const rx = tx + (vehicle.w / 2) * cos(th);
      const ry = ty + (vehicle.w / 2) * sin(th);
      const fade = max(0.3, i / this.tracks.length);
      
      push();
      translate(lx, ly);
      rotate(th);
      fill(251, 204, 137, Config.TRACK_FADE * fade);
      rect(0, 0, 14, 5, 2);
      pop();
      
      push();
      translate(rx, ry);
      rotate(th);
      fill(251, 204, 137, Config.TRACK_FADE * fade);
      rect(0, 0, 14, 5, 2);
      pop();
    }
  }
}