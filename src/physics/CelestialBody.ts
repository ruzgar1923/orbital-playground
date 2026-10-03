import { Vector2 } from './Vector2';
import { G_UNIVERSAL } from './Constants';

export interface CelestialBodyConfig {
  id: string;
  name: string;
  mass: number; // in kg
  mu?: number; // gravitational parameter km³/s² (if omitted, G * mass)
  radius: number; // in km
  position: Vector2;
  velocity: Vector2;
  color: string;
  glowColor?: string;
  atmosphereRadius?: number;
  atmosphereColor?: string;
  parentBodyId?: string | null;
}

/**
 * Represents a massive astronomical body (Sun, Earth, Moon).
 * Implements Newtonian gravitational field calculations.
 */
export class CelestialBody {
  readonly id: string;
  readonly name: string;
  readonly mass: number; // kg
  readonly mu: number; // km³/s² (G * M)
  readonly radius: number; // km
  position: Vector2;
  velocity: Vector2;
  readonly color: string;
  readonly glowColor?: string;
  readonly atmosphereRadius?: number;
  readonly atmosphereColor?: string;
  readonly parentBodyId: string | null;

  constructor(config: CelestialBodyConfig) {
    this.id = config.id;
    this.name = config.name;
    this.mass = config.mass;
    this.mu = config.mu ?? (G_UNIVERSAL * config.mass);
    this.radius = config.radius;
    this.position = config.position.clone();
    this.velocity = config.velocity.clone();
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.atmosphereRadius = config.atmosphereRadius;
    this.atmosphereColor = config.atmosphereColor;
    this.parentBodyId = config.parentBodyId ?? null;
  }

  /**
   * Calculates Newtonian gravitational acceleration vector exerted on a point at pos:
   * a = G * M / r² in the direction of the body center.
   * Vector form: a = (μ / r³) * (position - pos)
   */
  gravitationalAccelerationAt(pos: Vector2): Vector2 {
    const toBody = this.position.sub(pos);
    const distSq = toBody.magSq();
    const dist = Math.sqrt(distSq);

    // Softening or collision limit to avoid singularity at center
    if (dist < 1e-4) {
      return Vector2.zero();
    }

    // a = μ / r² along unit vector (toBody / dist)
    // a = (μ / dist³) * toBody
    const accelMag = this.mu / distSq;
    return toBody.scale(accelMag / dist);
  }

  /**
   * Calculates Newtonian gravitational force vector exerted on a body of mass m:
   * F = G * M * m / r²
   */
  gravitationalForceOn(pos: Vector2, mass: number): Vector2 {
    const accel = this.gravitationalAccelerationAt(pos);
    // F = m * a
    // Since accel is in km/s² and mass in kg, F is in kN (1 kg·km/s² = 1000 N = 1 kN)
    return accel.scale(mass);
  }

  clone(): CelestialBody {
    return new CelestialBody({
      id: this.id,
      name: this.name,
      mass: this.mass,
      mu: this.mu,
      radius: this.radius,
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      color: this.color,
      glowColor: this.glowColor,
      atmosphereRadius: this.atmosphereRadius,
      atmosphereColor: this.atmosphereColor,
      parentBodyId: this.parentBodyId,
    });
  }
}
