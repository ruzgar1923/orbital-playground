import { Vector2 } from './Vector2';
import { STANDARD_G0 } from './Constants';

export interface RocketStageConfig {
  id: string;
  name: string;
  dryMassKg: number;
  fuelMassKg: number;
  thrustVacN: number;
  thrustSLN: number;
  ispVacS: number;
  ispSLS: number;
  heightM: number;
  diameterM: number;
  engineCount: number;
}

export interface DebrisObject {
  id: string;
  name: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  angularVelocity: number;
  mass: number;
  width: number;
  height: number;
  timeSinceSeparation: number;
}

/**
 * Represents a single stage of a multi-stage rocket stack.
 */
export class RocketStage {
  readonly id: string;
  readonly name: string;
  readonly dryMassKg: number;
  fuelMassKg: number;
  readonly maxFuelMassKg: number;
  readonly thrustVacN: number;
  readonly thrustSLN: number;
  readonly ispVacS: number;
  readonly ispSLS: number;
  readonly heightM: number;
  readonly diameterM: number;
  readonly engineCount: number;

  separated = false;

  constructor(config: RocketStageConfig) {
    this.id = config.id;
    this.name = config.name;
    this.dryMassKg = config.dryMassKg;
    this.fuelMassKg = config.fuelMassKg;
    this.maxFuelMassKg = config.fuelMassKg;
    this.thrustVacN = config.thrustVacN;
    this.thrustSLN = config.thrustSLN;
    this.ispVacS = config.ispVacS;
    this.ispSLS = config.ispSLS;
    this.heightM = config.heightM;
    this.diameterM = config.diameterM;
    this.engineCount = config.engineCount;
  }

  get totalMassKg(): number {
    return this.dryMassKg + this.fuelMassKg;
  }

  get fuelFraction(): number {
    return this.maxFuelMassKg > 0 ? this.fuelMassKg / this.maxFuelMassKg : 0;
  }

  /**
   * Calculates specific impulse (Isp) in seconds accounting for atmospheric backpressure.
   */
  getIsp(ambientPressurePa: number): number {
    const pressureRatio = Math.max(0, Math.min(1, ambientPressurePa / 101325));
    return this.ispVacS - (this.ispVacS - this.ispSLS) * pressureRatio;
  }

  /**
   * Calculates actual thrust in Newtons (N) accounting for atmospheric backpressure.
   */
  getThrust(ambientPressurePa: number): number {
    if (this.fuelMassKg <= 0 || this.separated) return 0;
    const pressureRatio = Math.max(0, Math.min(1, ambientPressurePa / 101325));
    return this.thrustVacN - (this.thrustVacN - this.thrustSLN) * pressureRatio;
  }

  /**
   * Consumes propellant over dt seconds at given throttle and ambient pressure.
   * Returns fuel consumed in kg.
   */
  burnFuel(dt: number, throttle: number, ambientPressurePa: number): number {
    if (this.fuelMassKg <= 0 || throttle <= 0 || this.separated) {
      return 0;
    }

    const thrust = this.getThrust(ambientPressurePa) * throttle;
    const isp = this.getIsp(ambientPressurePa);

    // Mass flow rate: m_dot = F / (I_sp * g0)
    const massFlowRate = thrust / (isp * STANDARD_G0);
    const fuelUsed = Math.min(this.fuelMassKg, massFlowRate * dt);

    this.fuelMassKg -= fuelUsed;
    return fuelUsed;
  }

  clone(): RocketStage {
    const s = new RocketStage({
      id: this.id,
      name: this.name,
      dryMassKg: this.dryMassKg,
      fuelMassKg: this.fuelMassKg,
      thrustVacN: this.thrustVacN,
      thrustSLN: this.thrustSLN,
      ispVacS: this.ispVacS,
      ispSLS: this.ispSLS,
      heightM: this.heightM,
      diameterM: this.diameterM,
      engineCount: this.engineCount,
    });
    s.separated = this.separated;
    return s;
  }
}
