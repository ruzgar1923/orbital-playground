import { Vector2 } from './Vector2';
import {
  SPACECRAFT_DRY_MASS_KG,
  SPACECRAFT_INITIAL_FUEL_KG,
  SPACECRAFT_MAX_THRUST_KN,
  SPACECRAFT_MAX_FUEL_BURN_RATE_KG_PER_S,
} from './Constants';

export interface SpacecraftConfig {
  position: Vector2;
  velocity: Vector2;
  rotation?: number; // radians (0 rad = +X axis, Math.PI / 2 = +Y axis)
  dryMass?: number; // kg
  fuelMass?: number; // kg
  maxFuelMass?: number; // kg
  maxThrust?: number; // kN
  throttle?: number; // 0.0 to 1.0
  engineActive?: boolean;
}

export interface TrajectoryPoint {
  position: Vector2;
  relativeToBodyPosition: Vector2; // relative to dominant body (e.g. Earth)
  time: number;
}

/**
 * Represents the player-controlled spacecraft.
 * Follows Newtonian mechanics and variable mass rocket propulsion.
 */
export class Spacecraft {
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2; // total acceleration (gravitational + thrust)
  rotation: number; // heading in radians

  dryMass: number; // kg
  fuelMass: number; // kg
  readonly maxFuelMass: number; // kg
  readonly maxThrust: number; // kN

  throttle: number; // 0.0 to 1.0
  engineActive: boolean;

  // Recent position history for trajectory trail visualization
  readonly trajectoryTrail: TrajectoryPoint[] = [];
  readonly maxTrailLength = 400;
  private trailTimer = 0;

  constructor(config: SpacecraftConfig) {
    this.position = config.position.clone();
    this.velocity = config.velocity.clone();
    this.acceleration = Vector2.zero();
    this.rotation = config.rotation ?? Math.PI / 2; // Default pointing UP (+Y)
    this.dryMass = config.dryMass ?? SPACECRAFT_DRY_MASS_KG;
    this.fuelMass = config.fuelMass ?? SPACECRAFT_INITIAL_FUEL_KG;
    this.maxFuelMass = config.maxFuelMass ?? SPACECRAFT_INITIAL_FUEL_KG;
    this.maxThrust = config.maxThrust ?? SPACECRAFT_MAX_THRUST_KN;
    this.throttle = config.throttle ?? 0;
    this.engineActive = config.engineActive ?? false;
  }

  get totalMass(): number {
    return this.dryMass + this.fuelMass;
  }

  get headingVector(): Vector2 {
    return Vector2.fromAngle(this.rotation, 1);
  }

  get currentThrustForce(): number {
    if (!this.engineActive || this.fuelMass <= 0 || this.throttle <= 0) {
      return 0;
    }
    return this.maxThrust * this.throttle;
  }

  /**
   * Calculates thrust acceleration vector:
   * a = F / m
   * Direction follows spacecraft rotation angle.
   */
  getThrustAcceleration(): Vector2 {
    const thrustForce = this.currentThrustForce;
    if (thrustForce <= 0) {
      return Vector2.zero();
    }
    // a = F(kN) / m(kg) => km/s²
    const accelMag = thrustForce / this.totalMass;
    return this.headingVector.scale(accelMag);
  }

  /**
   * Consumes fuel over a time delta dt.
   * If fuel drops to 0, automatically shuts off engine.
   */
  burnFuel(dt: number): void {
    if (!this.engineActive || this.fuelMass <= 0 || this.throttle <= 0) {
      return;
    }

    const burnRate = SPACECRAFT_MAX_FUEL_BURN_RATE_KG_PER_S * this.throttle;
    const fuelUsed = burnRate * dt;

    if (this.fuelMass <= fuelUsed) {
      this.fuelMass = 0;
      this.engineActive = false;
      this.throttle = 0;
    } else {
      this.fuelMass -= fuelUsed;
    }
  }

  /**
   * Rotates spacecraft by deltaAngle (in radians).
   */
  rotate(deltaAngle: number): void {
    this.rotation += deltaAngle;
    // Normalize to [-PI, PI]
    while (this.rotation > Math.PI) this.rotation -= 2 * Math.PI;
    while (this.rotation < -Math.PI) this.rotation += 2 * Math.PI;
  }

  setThrottle(value: number): void {
    this.throttle = Math.max(0, Math.min(1, value));
    if (this.throttle > 0 && !this.engineActive) {
      this.engineActive = true;
    }
  }

  toggleEngine(): void {
    if (this.fuelMass <= 0) {
      this.engineActive = false;
      return;
    }
    this.engineActive = !this.engineActive;
    if (this.engineActive && this.throttle === 0) {
      this.throttle = 1.0;
    }
  }

  recordTrailPoint(primaryBodyPos: Vector2, simTime: number): void {
    this.trailTimer += 1;
    // Sample trail every few updates to keep rendering lightweight and smooth
    if (this.trailTimer % 2 === 0) {
      const relPos = this.position.sub(primaryBodyPos);
      this.trajectoryTrail.push({
        position: this.position.clone(),
        relativeToBodyPosition: relPos,
        time: simTime,
      });

      if (this.trajectoryTrail.length > this.maxTrailLength) {
        this.trajectoryTrail.shift();
      }
    }
  }

  clearTrail(): void {
    this.trajectoryTrail.length = 0;
  }

  clone(): Spacecraft {
    const sc = new Spacecraft({
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      rotation: this.rotation,
      dryMass: this.dryMass,
      fuelMass: this.fuelMass,
      maxFuelMass: this.maxFuelMass,
      maxThrust: this.maxThrust,
      throttle: this.throttle,
      engineActive: this.engineActive,
    });
    sc.acceleration = this.acceleration.clone();
    return sc;
  }
}
