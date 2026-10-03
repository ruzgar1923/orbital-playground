import { Vector2 } from './Vector2';
import { RocketStage, type DebrisObject } from './Staging';
import {
  STAGE1_NAME,
  STAGE1_DRY_MASS_KG,
  STAGE1_FUEL_MASS_KG,
  STAGE1_THRUST_VAC_N,
  STAGE1_THRUST_SL_N,
  STAGE1_ISP_VAC_S,
  STAGE1_ISP_SL_S,
  STAGE1_HEIGHT_M,
  STAGE1_DIAMETER_M,
  STAGE2_NAME,
  STAGE2_DRY_MASS_KG,
  STAGE2_FUEL_MASS_KG,
  STAGE2_THRUST_VAC_N,
  STAGE2_ISP_VAC_S,
  STAGE2_HEIGHT_M,
  STAGE2_DIAMETER_M,
  STAGE3_NAME,
  STAGE3_DRY_MASS_KG,
  STAGE3_FUEL_MASS_KG,
  STAGE3_THRUST_VAC_N,
  STAGE3_ISP_VAC_S,
  STAGE3_HEIGHT_M,
  STAGE3_DIAMETER_M,
  STAGE4_NAME,
  STAGE4_DRY_MASS_KG,
  STAGE4_FUEL_MASS_KG,
  STAGE4_THRUST_VAC_N,
  STAGE4_ISP_VAC_S,
  STAGE4_HEIGHT_M,
  STAGE4_DIAMETER_M,
  SATURN_V_AERODYNAMIC_DRAG_COEFFICIENT,
} from './Constants';

export interface TrajectoryPoint {
  position: Vector2; // in world meters
  relativeToBodyPosition: Vector2;
  time: number;
}

export interface SpacecraftConfig {
  position: Vector2; // meters
  velocity: Vector2; // m/s
  rotation?: number; // radians
  throttle?: number;
  engineActive?: boolean;
  isLanded?: boolean;
}

/**
 * Represents the multi-stage Saturn V Apollo launch vehicle.
 * Implements real SI staging, variable mass, aerodynamic drag, and attitude dynamics.
 */
export class Spacecraft {
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2 = Vector2.zero();
  rotation: number; // heading in radians
  angularVelocity = 0;

  throttle = 0;
  engineActive = false;
  isLanded = true; // Starts on launch pad
  landedBodyId: string | null = 'earth';
  landedSurfaceAngle: number | null = null;

  stages: RocketStage[] = [];
  activeStageIndex = 0;
  debrisList: DebrisObject[] = [];

  readonly trajectoryTrail: TrajectoryPoint[] = [];
  readonly maxTrailLength = 500;
  private trailTimer = 0;

  constructor(config: SpacecraftConfig) {
    this.position = config.position.clone();
    this.velocity = config.velocity.clone();
    this.rotation = config.rotation ?? Math.PI / 2; // Pointing vertically UP (+Y)
    this.throttle = config.throttle ?? 0;
    this.engineActive = config.engineActive ?? false;
    this.isLanded = config.isLanded ?? true;

    this.initSaturnVStages();
  }

  /**
   * Initializes the 4-stage Apollo Saturn V stack.
   */
  initSaturnVStages(): void {
    this.stages = [
      new RocketStage({
        id: 's-ic',
        name: STAGE1_NAME,
        dryMassKg: STAGE1_DRY_MASS_KG,
        fuelMassKg: STAGE1_FUEL_MASS_KG,
        thrustVacN: STAGE1_THRUST_VAC_N,
        thrustSLN: STAGE1_THRUST_SL_N,
        ispVacS: STAGE1_ISP_VAC_S,
        ispSLS: STAGE1_ISP_SL_S,
        heightM: STAGE1_HEIGHT_M,
        diameterM: STAGE1_DIAMETER_M,
        engineCount: 5,
      }),
      new RocketStage({
        id: 's-ii',
        name: STAGE2_NAME,
        dryMassKg: STAGE2_DRY_MASS_KG,
        fuelMassKg: STAGE2_FUEL_MASS_KG,
        thrustVacN: STAGE2_THRUST_VAC_N,
        thrustSLN: STAGE2_THRUST_VAC_N * 0.9,
        ispVacS: STAGE2_ISP_VAC_S,
        ispSLS: 300,
        heightM: STAGE2_HEIGHT_M,
        diameterM: STAGE2_DIAMETER_M,
        engineCount: 5,
      }),
      new RocketStage({
        id: 's-ivb',
        name: STAGE3_NAME,
        dryMassKg: STAGE3_DRY_MASS_KG,
        fuelMassKg: STAGE3_FUEL_MASS_KG,
        thrustVacN: STAGE3_THRUST_VAC_N,
        thrustSLN: STAGE3_THRUST_VAC_N * 0.9,
        ispVacS: STAGE3_ISP_VAC_S,
        ispSLS: 300,
        heightM: STAGE3_HEIGHT_M,
        diameterM: STAGE3_DIAMETER_M,
        engineCount: 1,
      }),
      new RocketStage({
        id: 'apollo-csm',
        name: STAGE4_NAME,
        dryMassKg: STAGE4_DRY_MASS_KG,
        fuelMassKg: STAGE4_FUEL_MASS_KG,
        thrustVacN: STAGE4_THRUST_VAC_N,
        thrustSLN: STAGE4_THRUST_VAC_N * 0.85,
        ispVacS: STAGE4_ISP_VAC_S,
        ispSLS: 280,
        heightM: STAGE4_HEIGHT_M,
        diameterM: STAGE4_DIAMETER_M,
        engineCount: 1,
      }),
    ];
    this.activeStageIndex = 0;
  }

  get activeStage(): RocketStage | null {
    if (this.activeStageIndex < this.stages.length) {
      return this.stages[this.activeStageIndex];
    }
    return null;
  }

  /**
   * Total mass of all remaining attached stages in kg.
   */
  get totalMassKg(): number {
    let mass = 0;
    for (let i = this.activeStageIndex; i < this.stages.length; i++) {
      mass += this.stages[i].totalMassKg;
    }
    return Math.max(100, mass);
  }

  /**
   * Total dry mass of all remaining attached stages in kg.
   */
  get dryMassKg(): number {
    let mass = 0;
    for (let i = this.activeStageIndex; i < this.stages.length; i++) {
      mass += this.stages[i].dryMassKg;
    }
    return mass;
  }

  /**
   * Current remaining fuel mass in active stage (or across remaining stack).
   */
  get activeStageFuelKg(): number {
    return this.activeStage?.fuelMassKg ?? 0;
  }

  get activeStageMaxFuelKg(): number {
    return this.activeStage?.maxFuelMassKg ?? 0;
  }

  get headingVector(): Vector2 {
    return Vector2.fromAngle(this.rotation, 1);
  }

  /**
   * Effective cross-sectional aerodynamic area based on active stage diameter.
   */
  get aerodynamicAreaM2(): number {
    const stage = this.activeStage;
    const diameter = stage ? stage.diameterM : 3.9;
    return Math.PI * Math.pow(diameter / 2, 2);
  }

  get dragCoefficient(): number {
    return SATURN_V_AERODYNAMIC_DRAG_COEFFICIENT;
  }

  /**
   * Total height of the remaining stack in meters.
   */
  get currentLengthM(): number {
    let h = 0;
    for (let i = this.activeStageIndex; i < this.stages.length; i++) {
      h += this.stages[i].heightM;
    }
    return Math.max(5, h);
  }

  /**
   * Current thrust force in Newtons (N).
   */
  getCurrentThrustN(ambientPressurePa: number): number {
    if (!this.engineActive || this.throttle <= 0 || !this.activeStage) {
      return 0;
    }
    return this.activeStage.getThrust(ambientPressurePa) * this.throttle;
  }

  /**
   * Thrust acceleration vector: a = F / m along heading.
   */
  getThrustAcceleration(ambientPressurePa: number): Vector2 {
    const thrust = this.getCurrentThrustN(ambientPressurePa);
    if (thrust <= 0) return Vector2.zero();
    const accelMag = thrust / this.totalMassKg; // m/s²
    return this.headingVector.scale(accelMag);
  }

  /**
   * Burns fuel in the active stage over dt seconds.
   */
  burnFuel(dt: number, ambientPressurePa: number): void {
    if (!this.engineActive || this.throttle <= 0 || !this.activeStage) {
      return;
    }

    this.activeStage.burnFuel(dt, this.throttle, ambientPressurePa);

    if (this.activeStage.fuelMassKg <= 0) {
      this.activeStage.fuelMassKg = 0;
      this.engineActive = false;
      this.throttle = 0;
    }
  }

  /**
   * Separates the active stage and advances to the next stage.
   * Spawns a physical debris object for the spent stage.
   */
  stage(): boolean {
    if (this.activeStageIndex >= this.stages.length - 1) {
      return false; // No more stages to separate
    }

    const spentStage = this.stages[this.activeStageIndex];
    spentStage.separated = true;

    // Separation impulse: spent stage is pushed backward slightly (-heading)
    const sepVelOffset = this.headingVector.scale(-3.5);
    const spentPos = this.position.add(this.headingVector.scale(-spentStage.heightM * 0.5));

    this.debrisList.push({
      id: `debris-${spentStage.id}-${Date.now()}`,
      name: `${spentStage.name} (Spent)`,
      position: spentPos,
      velocity: this.velocity.add(sepVelOffset),
      rotation: this.rotation,
      angularVelocity: (Math.random() - 0.5) * 0.1,
      mass: spentStage.totalMassKg,
      width: spentStage.diameterM,
      height: spentStage.heightM,
      timeSinceSeparation: 0,
    });

    // Advance to next stage
    this.activeStageIndex++;

    // Small forward boost to active vehicle from separation springs
    this.velocity = this.velocity.add(this.headingVector.scale(1.2));

    // If fuel is available in next stage, set nominal throttle
    if (this.activeStage && this.activeStage.fuelMassKg > 0) {
      this.throttle = 1.0;
      this.engineActive = true;
    }

    return true;
  }

  rotate(deltaAngle: number): void {
    if (this.isLanded) return; // Cannot rotate while locked on launch clamps
    this.rotation += deltaAngle;
    while (this.rotation > Math.PI) this.rotation -= 2 * Math.PI;
    while (this.rotation < -Math.PI) this.rotation += 2 * Math.PI;
  }

  setThrottle(value: number): void {
    this.throttle = Math.max(0, Math.min(1, value));
    if (this.throttle > 0 && !this.engineActive && (this.activeStage?.fuelMassKg ?? 0) > 0) {
      this.engineActive = true;
    }
  }

  toggleEngine(): void {
    if ((this.activeStage?.fuelMassKg ?? 0) <= 0) {
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
}
