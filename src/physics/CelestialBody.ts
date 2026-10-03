import { Vector2 } from './Vector2';
import { G_UNIVERSAL } from './Constants';

export interface CelestialBodyConfig {
  id: string;
  name: string;
  mass: number; // in kg
  mu?: number; // gravitational parameter m³/s² (if omitted, G * mass)
  radius: number; // in meters
  position: Vector2;
  velocity: Vector2;
  color: string;
  glowColor?: string;
  rotationRate?: number; // radians per second
  initialRotation?: number; // radians
  hasAtmosphere?: boolean;
  atmosphereRadius?: number;
  atmosphereColor?: string;
  parentBodyId?: string | null;
}

/**
 * Represents an astronomical body (Earth, Moon, Sun) in real SI coordinates.
 */
export class CelestialBody {
  readonly id: string;
  readonly name: string;
  readonly mass: number; // kg
  readonly mu: number; // m³/s² (G * M)
  readonly radius: number; // meters
  position: Vector2;
  velocity: Vector2;
  readonly color: string;
  readonly glowColor?: string;
  readonly rotationRate: number; // rad/s
  rotationAngle: number; // current surface rotation angle
  readonly hasAtmosphere: boolean;
  readonly atmosphereRadius?: number;
  readonly atmosphereColor?: string;
  readonly parentBodyId: string | null;

  constructor(config: CelestialBodyConfig) {
    this.id = config.id;
    this.name = config.name;
    this.mass = config.mass;
    this.mu = config.mu ?? G_UNIVERSAL * config.mass;
    this.radius = config.radius;
    this.position = config.position.clone();
    this.velocity = config.velocity.clone();
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.rotationRate = config.rotationRate ?? 0;
    this.rotationAngle = config.initialRotation ?? 0;
    this.hasAtmosphere = config.hasAtmosphere ?? false;
    this.atmosphereRadius = config.atmosphereRadius;
    this.atmosphereColor = config.atmosphereColor;
    this.parentBodyId = config.parentBodyId ?? null;
  }

  /**
   * Calculates Newtonian gravitational acceleration vector at world position pos:
   * a = (mu / r³) * (position - pos) in m/s²
   */
  gravitationalAccelerationAt(pos: Vector2): Vector2 {
    const toBody = this.position.sub(pos);
    const distSq = toBody.magSq();
    const dist = Math.sqrt(distSq);

    if (dist < 1.0) {
      return Vector2.zero();
    }

    const accelMag = this.mu / distSq;
    return toBody.scale(accelMag / dist);
  }

  /**
   * Distance from body center in meters.
   */
  getDistance(pos: Vector2): number {
    return this.position.dist(pos);
  }

  /**
   * Altitude above mean surface in meters.
   */
  getAltitude(pos: Vector2): number {
    return this.getDistance(pos) - this.radius;
  }

  /**
   * Calculates the inertial velocity of the planet's surface (or atmosphere)
   * at position pos due to planetary rotation.
   * v_surface = v_orbit + (omega x r_rel)
   */
  getSurfaceVelocityAt(pos: Vector2): Vector2 {
    const relPos = pos.sub(this.position);
    // 2D tangential velocity due to counter-clockwise rotation:
    // v_rot = (-omega * y, omega * x)
    const rotVel = new Vector2(
      -this.rotationRate * relPos.y,
      this.rotationRate * relPos.x
    );
    return this.velocity.add(rotVel);
  }

  /**
   * Advances the body's axial rotation by dt seconds.
   */
  updateRotation(dt: number): void {
    this.rotationAngle += this.rotationRate * dt;
    while (this.rotationAngle > Math.PI * 2) this.rotationAngle -= Math.PI * 2;
    while (this.rotationAngle < 0) this.rotationAngle += Math.PI * 2;
  }
}
