/**
 * 2D Vector mathematics for orbital mechanics simulations.
 * Immutable class to ensure mathematical integrity and avoid mutation bugs.
 */
export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angleRad: number, magnitude = 1): Vector2 {
    return new Vector2(
      Math.cos(angleRad) * magnitude,
      Math.sin(angleRad) * magnitude
    );
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vector2 {
    if (scalar === 0) {
      return Vector2.zero();
    }
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 2D cross product: Returns the z-component of the 3D cross product (A × B)_z
   * Equal to |A| |B| sin(θ) = this.x * v.y - this.y * v.x
   */
  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  mag(): number {
    return Math.sqrt(this.magSq());
  }

  normalize(): Vector2 {
    const m = this.mag();
    if (m === 0) {
      return Vector2.zero();
    }
    return new Vector2(this.x / m, this.y / m);
  }

  dist(v: Vector2): number {
    return this.sub(v).mag();
  }

  distSq(v: Vector2): number {
    return this.sub(v).magSq();
  }

  rotate(angleRad: number): Vector2 {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  equals(v: Vector2, tolerance = 1e-9): boolean {
    return Math.abs(this.x - v.x) <= tolerance && Math.abs(this.y - v.y) <= tolerance;
  }
}
