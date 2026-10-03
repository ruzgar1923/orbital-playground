import { Vector2 } from '../physics/Vector2';

export type CameraTarget = 'spacecraft' | 'earth' | 'moon' | 'sun' | 'free';

/**
 * Floating-origin multi-scale camera system.
 * Converts real SI coordinates in meters to viewport coordinates without 32-bit floating point precision loss.
 */
export class Camera {
  pos: Vector2 = Vector2.zero();
  zoom = 4.0; // pixels per meter (default zoomed in on 110m Saturn V on pad)
  target: CameraTarget = 'spacecraft';

  // Smooth dragging state
  isDragging = false;
  dragStart: { x: number; y: number } = { x: 0, y: 0 };
  dragCameraStart: Vector2 = Vector2.zero();

  // Zoom limits: from close-up on a 1-meter capsule (15 px/m) to full Earth-Moon-Sun system (1e-10 px/m)
  readonly minZoom = 1e-10;
  readonly maxZoom = 25.0;

  constructor(initialPos: Vector2, initialZoom = 4.0) {
    this.pos = initialPos.clone();
    this.zoom = initialZoom;
  }

  /**
   * Converts world coordinates in meters to canvas screen coordinates in pixels.
   * Uses camera-relative coordinate math (floating origin).
   */
  worldToScreen(worldPos: Vector2, screenWidth: number, screenHeight: number): { x: number; y: number } {
    // Relative displacement in meters
    const dx = worldPos.x - this.pos.x;
    const dy = worldPos.y - this.pos.y;

    return {
      x: screenWidth / 2 + dx * this.zoom,
      y: screenHeight / 2 - dy * this.zoom, // Invert Y for canvas
    };
  }

  /**
   * Converts screen pixel coordinates to world coordinates in meters.
   */
  screenToWorld(screenX: number, screenY: number, screenWidth: number, screenHeight: number): Vector2 {
    const dx = (screenX - screenWidth / 2) / this.zoom;
    const dy = (screenHeight / 2 - screenY) / this.zoom;

    return new Vector2(this.pos.x + dx, this.pos.y + dy);
  }

  /**
   * Zooms toward a specific screen point (e.g. mouse cursor).
   */
  zoomAt(
    factor: number,
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    const worldBefore = this.screenToWorld(screenX, screenY, screenWidth, screenHeight);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));

    if (this.target === 'free') {
      const worldAfter = this.screenToWorld(screenX, screenY, screenWidth, screenHeight);
      const diff = worldBefore.sub(worldAfter);
      this.pos = this.pos.add(diff);
    }
  }
}
