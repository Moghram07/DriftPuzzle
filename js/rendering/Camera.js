/**
 * Camera system - follows player and manages viewport
 * Single Responsibility: Control screen transformation and follow logic
 * Lines: 48
 */
class Camera {
  constructor(smoothing = 0.08) {
    this.x = 0;           // Camera position (top-left of visible area)
    this.y = 0;
    this.smoothing = smoothing; // Higher = faster follow (0.08 = responsive)
  }
  
  // Smoothly follow target (player)
  follow(target, canvasWidth, canvasHeight) {
    // Calculate ideal camera position to center target
    const targetX = target.x - canvasWidth / 2;
    const targetY = target.y - canvasHeight / 2;
    
    // Smooth interpolation
    this.x += (targetX - this.x) * this.smoothing;
    this.y += (targetY - this.y) * this.smoothing;
  }
  
  // Apply camera transformation (call BEFORE drawing world)
  begin() {
    push();
    translate(-this.x, -this.y);
  }
  
  // End camera transformation (call AFTER drawing world)
  end() {
    pop();
  }
  
  // Get current camera position
  getPosition() {
    return { x: this.x, y: this.y };
  }
  
  // Set position directly (for cutscenes/debugging)
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
}