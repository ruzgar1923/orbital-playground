import { Vector2 } from './Vector2';
import { CelestialBody } from './CelestialBody';
import { Spacecraft } from './Spacecraft';
import {
  type Integrator,
  VelocityVerletIntegrator,
  SemiImplicitEulerIntegrator,
  RK4Integrator,
} from './Integrator';
import { calculateOrbitalElements, type OrbitalElements } from './Orbit';
import { Atmosphere } from './Atmosphere';
import { Aerodynamics, type AerodynamicState } from './Aerodynamics';
import { SCENARIOS, type MissionScenario } from '../simulation/Scenario';
import {
  EARTH_RADIUS_M,
  EARTH_MU,
  EARTH_MASS_KG,
  EARTH_ROTATION_RATE_RAD_PER_S,
  MOON_RADIUS_M,
  MOON_MU,
  MOON_MASS_KG,
  MOON_ORBITAL_DISTANCE_M,
  MOON_ORBITAL_SPEED_MPS,
  SUN_RADIUS_M,
  SUN_MU,
  SUN_MASS_KG,
  SUN_EARTH_DISTANCE_M,
  EARTH_SOLAR_ORBITAL_SPEED_MPS,
} from './Constants';

export interface PhysicsEngineState {
  time: number;
  timeWarp: number;
  isPaused: boolean;
  isCrashed: boolean;
  crashedBodyName: string | null;
  aerodynamics: AerodynamicState | null;
  maxQReached: number; // Peak dynamic pressure recorded in ascent
}

/**
 * Master Newtonian Physics Engine operating strictly in real SI units (m, kg, s, N).
 * Manages N-body gravity, atmospheric drag, rocket propulsion, staging, surface physics, and time warp substepping.
 */
export class PhysicsEngine {
  sun!: CelestialBody;
  earth!: CelestialBody;
  moon!: CelestialBody;
  spacecraft!: Spacecraft;

  integrator: Integrator;
  time = 0;
  timeWarp = 1;
  isPaused = true;
  isCrashed = false;
  crashedBodyName: string | null = null;
  activeScenarioIndex = 0;

  // Maximum sub-step duration in simulation seconds
  readonly maxSubstepDt = 0.05; // 50 milliseconds

  latestAerodynamics: AerodynamicState | null = null;
  maxDynamicPressurePa = 0;

  constructor(integrator?: Integrator) {
    this.integrator = integrator ?? new VelocityVerletIntegrator();
    this.initSystem();
  }

  /**
   * Initializes celestial bodies and launches the default scenario (Mission 01: Launch from Pad 39A).
   */
  initSystem(scenarioIndex = 0): void {
    this.time = 0;
    this.isCrashed = false;
    this.crashedBodyName = null;
    this.latestAerodynamics = null;
    this.maxDynamicPressurePa = 0;
    this.activeScenarioIndex = scenarioIndex;

    // 1. Sun at origin (0, 0)
    this.sun = new CelestialBody({
      id: 'sun',
      name: 'Sun',
      mass: SUN_MASS_KG,
      mu: SUN_MU,
      radius: SUN_RADIUS_M,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.4)',
    });

    // 2. Earth: Real distance 149.6M km along +X
    this.earth = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: EARTH_MASS_KG,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_M,
      position: new Vector2(SUN_EARTH_DISTANCE_M, 0),
      velocity: new Vector2(0, EARTH_SOLAR_ORBITAL_SPEED_MPS),
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
      rotationRate: EARTH_ROTATION_RATE_RAD_PER_S,
      hasAtmosphere: true,
      atmosphereRadius: EARTH_RADIUS_M + 120000,
      atmosphereColor: 'rgba(56, 189, 248, 0.25)',
      parentBodyId: 'sun',
    });

    // 3. Moon: Real distance 384,400 km from Earth along +Y
    this.moon = new CelestialBody({
      id: 'moon',
      name: 'Moon',
      mass: MOON_MASS_KG,
      mu: MOON_MU,
      radius: MOON_RADIUS_M,
      position: this.earth.position.add(new Vector2(0, MOON_ORBITAL_DISTANCE_M)),
      velocity: this.earth.velocity.add(new Vector2(-MOON_ORBITAL_SPEED_MPS, 0)),
      color: '#cbd5e1',
      rotationRate: (2 * Math.PI) / (27.32 * 86400), // Tidally locked
      hasAtmosphere: false,
      parentBodyId: 'earth',
    });

    // 4. Spacecraft configured by Scenario
    const scenario = SCENARIOS[scenarioIndex] ?? SCENARIOS[0];
    this.spacecraft = scenario.setup(this.earth, this.moon);

    // Initial trail point
    const primary = this.getDominantBody();
    this.spacecraft.recordTrailPoint(primary.position, 0);
  }

  get bodies(): CelestialBody[] {
    return [this.sun, this.earth, this.moon];
  }

  get currentScenario(): MissionScenario {
    return SCENARIOS[this.activeScenarioIndex] ?? SCENARIOS[0];
  }

  loadScenario(index: number): void {
    this.initSystem(index);
  }

  setIntegrator(type: 'verlet' | 'rk4' | 'euler'): void {
    if (type === 'verlet') {
      this.integrator = new VelocityVerletIntegrator();
    } else if (type === 'rk4') {
      this.integrator = new RK4Integrator();
    } else {
      this.integrator = new SemiImplicitEulerIntegrator();
    }
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  setTimeWarp(warp: number): void {
    this.timeWarp = warp;
  }

  alignPrograde(): void {
    if (this.spacecraft.isLanded) return;
    const primary = this.getDominantBody();
    const relVel = this.spacecraft.velocity.sub(primary.velocity);
    if (relVel.mag() > 1e-3) {
      this.spacecraft.rotation = relVel.angle();
    }
  }

  alignRetrograde(): void {
    if (this.spacecraft.isLanded) return;
    const primary = this.getDominantBody();
    const relVel = this.spacecraft.velocity.sub(primary.velocity);
    if (relVel.mag() > 1e-3) {
      this.spacecraft.rotation = relVel.angle() + Math.PI;
    }
  }

  setThrottle(value: number): void {
    this.spacecraft.setThrottle(value);
  }

  cutThrottle(): void {
    this.spacecraft.setThrottle(0);
    this.spacecraft.engineActive = false;
  }

  fullThrottle(): void {
    this.spacecraft.setThrottle(1.0);
    this.spacecraft.engineActive = true;
  }

  stage(): boolean {
    return this.spacecraft.stage();
  }

  /**
   * Determines dominant gravitational primary body (Earth, Moon, or Sun)
   * using exact Sphere of Influence (SOI) radii.
   */
  getDominantBody(pos: Vector2 = this.spacecraft.position): CelestialBody {
    // 1. Moon SOI: r_SOI = D * (M_moon / M_earth)^0.4 ≈ 66,180 km
    const distToMoon = pos.dist(this.moon.position);
    const moonSoi = MOON_ORBITAL_DISTANCE_M * Math.pow(MOON_MU / EARTH_MU, 0.4);
    if (distToMoon <= moonSoi) {
      return this.moon;
    }

    // 2. Earth Hill Sphere: r_H = D * (M_earth / 3M_sun)^(1/3) ≈ 1.5M km
    const distToEarth = pos.dist(this.earth.position);
    const earthHillSphere = SUN_EARTH_DISTANCE_M * Math.pow(EARTH_MU / (3 * SUN_MU), 1 / 3);
    if (distToEarth <= earthHillSphere) {
      return this.earth;
    }

    // 3. Otherwise Sun
    return this.sun;
  }

  /**
   * Computes Keplerian orbital elements of the spacecraft relative to dominant body.
   */
  getOrbitalElements(): OrbitalElements {
    const primary = this.getDominantBody();
    return calculateOrbitalElements(this.spacecraft.position, this.spacecraft.velocity, primary);
  }

  /**
   * Sums gravitational acceleration from all celestial bodies at position pos.
   */
  calculateGravitationalAcceleration(pos: Vector2): Vector2 {
    let totalAccel = Vector2.zero();
    for (const body of this.bodies) {
      const a = body.gravitationalAccelerationAt(pos);
      totalAccel = totalAccel.add(a);
    }
    return totalAccel;
  }

  /**
   * Advances the simulation by wall-clock delta seconds.
   */
  update(deltaWallTime: number): void {
    if (this.isPaused) {
      return;
    }

    const safeWallTime = Math.min(deltaWallTime, 0.1);

    if (this.isCrashed) {
      // Planet continues moving, wreckage stays attached to crashed surface
      const crashedBody = this.bodies.find((b) => b.name === this.crashedBodyName) ?? this.earth;
      const relPos = this.spacecraft.position.sub(crashedBody.position);
      const curAngle = Math.atan2(relPos.y, relPos.x);
      const newAngle = curAngle + crashedBody.rotationRate * safeWallTime;
      this.spacecraft.position = crashedBody.position.add(
        new Vector2(Math.cos(newAngle), Math.sin(newAngle)).scale(crashedBody.radius + 1.0)
      );
      this.spacecraft.velocity = crashedBody.getSurfaceVelocityAt(this.spacecraft.position);
      return;
    }
    const totalSimDt = safeWallTime * this.timeWarp;

    // Substepping: ensure substep is small enough for stability
    // For extreme time warp (up to 100,000x), cap substeps for 60fps performance
    const numSubsteps = Math.min(
      Math.max(1, Math.ceil(totalSimDt / this.maxSubstepDt)),
      350
    );
    const substepDt = totalSimDt / numSubsteps;

    for (let i = 0; i < numSubsteps; i++) {
      this.stepSubstep(substepDt);
      if (this.isCrashed) break;
    }

    const primary = this.getDominantBody();
    this.spacecraft.recordTrailPoint(primary.position, this.time);
  }

  /**
   * Single physics substep of duration dt in SI seconds.
   */
  private stepSubstep(dt: number): void {
    // 1. Planetary dynamics:
    // Earth orbits Sun
    const earthSunAccel = this.sun.gravitationalAccelerationAt(this.earth.position);
    this.earth.velocity = this.earth.velocity.add(earthSunAccel.scale(dt));
    this.earth.position = this.earth.position.add(this.earth.velocity.scale(dt));
    this.earth.updateRotation(dt);

    // Moon orbits Earth (and Sun)
    const moonEarthAccel = this.earth.gravitationalAccelerationAt(this.moon.position);
    const moonSunAccel = this.sun.gravitationalAccelerationAt(this.moon.position);
    this.moon.velocity = this.moon.velocity.add(moonEarthAccel.add(moonSunAccel).scale(dt));
    this.moon.position = this.moon.position.add(this.moon.velocity.scale(dt));
    this.moon.updateRotation(dt);

    // 2. Spacecraft surface / flight physics:
    const sc = this.spacecraft;
    const primary = this.getDominantBody();
    const altitude = primary.getAltitude(sc.position);

    // Ambient pressure at altitude (0 outside Earth)
    const ambientPressure =
      primary.id === 'earth' ? Atmosphere.getPressure(altitude) : 0;

    // If rocket is sitting on the launch pad / surface:
    if (sc.isLanded) {
      const landedBody = this.bodies.find((b) => b.id === sc.landedBodyId) ?? primary;
      // Rocket thrust must exceed gravity to lift off
      const thrust = sc.getCurrentThrustN(ambientPressure);
      const weight = sc.totalMassKg * (landedBody.mu / (landedBody.radius * landedBody.radius));

      if (thrust > weight && sc.throttle > 0.1 && sc.engineActive) {
        // Liftoff! Release launch clamps
        sc.isLanded = false;
        sc.landedBodyId = null;
        sc.landedSurfaceAngle = null;
      } else {
        // Still on pad: burn fuel if engines fired, and keep position locked to rotating surface
        sc.burnFuel(dt, ambientPressure);

        if (sc.landedSurfaceAngle === null) {
          const relPos = sc.position.sub(landedBody.position);
          sc.landedSurfaceAngle = Math.atan2(relPos.y, relPos.x) - landedBody.rotationAngle;
        }

        const currentSurfaceAngle = sc.landedSurfaceAngle + landedBody.rotationAngle;
        const surfaceNorm = new Vector2(Math.cos(currentSurfaceAngle), Math.sin(currentSurfaceAngle));
        const surfaceDist = landedBody.radius + 1.0;

        sc.position = landedBody.position.add(surfaceNorm.scale(surfaceDist));
        sc.velocity = landedBody.getSurfaceVelocityAt(sc.position);
        sc.rotation = currentSurfaceAngle;
        sc.acceleration = Vector2.zero();

        this.time += dt;
        return;
      }
    }

    // 3. Rocket fuel burn
    sc.burnFuel(dt, ambientPressure);

    // 4. Aerodynamic forces on spacecraft
    let dragForce = Vector2.zero();
    if (primary.id === 'earth' && altitude < 120000) {
      const atmoVel = primary.getSurfaceVelocityAt(sc.position);
      const velRelAir = sc.velocity.sub(atmoVel);
      const aero = Aerodynamics.computeDrag(
        altitude,
        velRelAir,
        sc.dragCoefficient,
        sc.aerodynamicAreaM2
      );
      dragForce = aero.dragForce;
      this.latestAerodynamics = aero;

      if (aero.dynamicPressure > this.maxDynamicPressurePa) {
        this.maxDynamicPressurePa = aero.dynamicPressure;
      }
    } else {
      this.latestAerodynamics = null;
    }

    // 5. Numerical integration of spacecraft state
    const calcAccel = (pos: Vector2, _vel: Vector2, _t: number): Vector2 => {
      const gravAccel = this.calculateGravitationalAcceleration(pos);
      const thrustAccel = sc.getThrustAcceleration(ambientPressure);
      const dragAccel = dragForce.scale(1 / sc.totalMassKg);
      return gravAccel.add(thrustAccel).add(dragAccel);
    };

    const nextState = this.integrator.step(
      {
        position: sc.position,
        velocity: sc.velocity,
        acceleration: sc.acceleration,
      },
      dt,
      this.time,
      calcAccel
    );

    sc.position = nextState.position;
    sc.velocity = nextState.velocity;
    sc.acceleration = nextState.acceleration;

    // 6. Surface collision & touchdown detection
    for (const body of this.bodies) {
      const dist = sc.position.dist(body.position);
      if (dist <= body.radius) {
        const impactSpeed = sc.velocity.sub(body.getSurfaceVelocityAt(sc.position)).mag();

        // Safe landing criteria (Moon < 5 m/s, Earth < 10 m/s with landing gear/chutes)
        const maxSafeSpeed = body.id === 'moon' ? 5.0 : 10.0;

        if (impactSpeed <= maxSafeSpeed && sc.activeStageIndex === 3) {
          // Gentle touchdown
          sc.isLanded = true;
          sc.landedBodyId = body.id;
          const relPos = sc.position.sub(body.position);
          sc.landedSurfaceAngle = Math.atan2(relPos.y, relPos.x) - body.rotationAngle;
          const currentSurfaceAngle = sc.landedSurfaceAngle + body.rotationAngle;
          const surfaceNorm = new Vector2(Math.cos(currentSurfaceAngle), Math.sin(currentSurfaceAngle));
          sc.position = body.position.add(surfaceNorm.scale(body.radius + 1.0));
          sc.velocity = body.getSurfaceVelocityAt(sc.position);
          sc.rotation = currentSurfaceAngle;
          sc.throttle = 0;
          sc.engineActive = false;
        } else {
          // Crash!
          this.isCrashed = true;
          this.crashedBodyName = body.name;
          const surfaceDir = sc.position.sub(body.position).normalize();
          sc.position = body.position.add(surfaceDir.scale(body.radius + 1.0));
          sc.velocity = body.getSurfaceVelocityAt(sc.position);
          sc.engineActive = false;
          sc.throttle = 0;
        }
        break;
      }
    }

    // 7. Update separated stage debris (gravity + drag)
    for (let d = sc.debrisList.length - 1; d >= 0; d--) {
      const debris = sc.debrisList[d];
      debris.timeSinceSeparation += dt;
      debris.rotation += debris.angularVelocity * dt;

      const gravA = this.calculateGravitationalAcceleration(debris.position);
      let debrisDragA = Vector2.zero();

      const distEarth = debris.position.dist(this.earth.position);
      if (distEarth < this.earth.radius + 120000) {
        const alt = distEarth - this.earth.radius;
        const atmoV = this.earth.getSurfaceVelocityAt(debris.position);
        const relV = debris.velocity.sub(atmoV);
        const aero = Aerodynamics.computeDrag(alt, relV, 0.8, debris.width * 2);
        debrisDragA = aero.dragForce.scale(1 / debris.mass);
      }

      debris.velocity = debris.velocity.add(gravA.add(debrisDragA).scale(dt));
      debris.position = debris.position.add(debris.velocity.scale(dt));

      // Remove debris if it impacts Earth or Moon
      if (
        debris.position.dist(this.earth.position) <= this.earth.radius ||
        debris.position.dist(this.moon.position) <= this.moon.radius
      ) {
        sc.debrisList.splice(d, 1);
      }
    }

    this.time += dt;
  }
}
