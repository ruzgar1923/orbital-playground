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
import {
  EARTH_RADIUS_KM,
  EARTH_MU,
  EARTH_MASS_KG,
  EARTH_COLOR,
  EARTH_ATMOSPHERE_COLOR,
  MOON_DISTANCE_KM,
  MOON_RADIUS_KM,
  MOON_MU,
  MOON_MASS_KG,
  MOON_COLOR,
  SUN_DISTANCE_KM,
  SUN_RADIUS_KM,
  SUN_MU,
  SUN_MASS_KG,
  SUN_COLOR,
  SUN_GLOW_COLOR,
} from './Constants';

export interface PhysicsEngineState {
  time: number;
  timeWarp: number;
  paused: boolean;
  crashed: boolean;
  crashedBodyName: string | null;
}

/**
 * Main Newtonian Physics Engine.
 * Manages celestial bodies, spacecraft, N-body gravity, thrust, substepping, and orbital telemetry.
 */
export class PhysicsEngine {
  sun!: CelestialBody;
  earth!: CelestialBody;
  moon!: CelestialBody;
  spacecraft!: Spacecraft;

  integrator: Integrator;
  time = 0;
  timeWarp = 1;
  isPaused = true; // Starts paused per requirement
  isCrashed = false;
  crashedBodyName: string | null = null;

  // Maximum sub-step delta time (in seconds) to guarantee numerical stability at high time warp
  readonly maxSubstepDt = 0.05; // 50 milliseconds

  constructor(integrator?: Integrator) {
    this.integrator = integrator ?? new VelocityVerletIntegrator();
    this.initSystem();
  }

  /**
   * Initializes or resets the entire Sun-Earth-Moon-Spacecraft system.
   */
  initSystem(): void {
    this.time = 0;
    this.isCrashed = false;
    this.crashedBodyName = null;

    // 1. Sun at coordinate origin (0, 0)
    this.sun = new CelestialBody({
      id: 'sun',
      name: 'Sun',
      mass: SUN_MASS_KG,
      mu: SUN_MU,
      radius: SUN_RADIUS_KM,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: SUN_COLOR,
      glowColor: SUN_GLOW_COLOR,
    });

    // 2. Earth: Distance 150,000 km along +X
    // Circular orbital speed around Sun: v_E = √(μ_S / D_SE)
    const earthSpeed = Math.sqrt(SUN_MU / SUN_DISTANCE_KM); // ~4.4294 km/s
    this.earth = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: EARTH_MASS_KG,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_KM,
      position: new Vector2(SUN_DISTANCE_KM, 0),
      velocity: new Vector2(0, earthSpeed),
      color: EARTH_COLOR,
      atmosphereRadius: EARTH_RADIUS_KM * 1.15,
      atmosphereColor: EARTH_ATMOSPHERE_COLOR,
      parentBodyId: 'sun',
    });

    // 3. Moon: Distance 10,000 km from Earth along +Y
    // Circular orbital speed around Earth: v_M = √(μ_E / D_EM)
    const moonSpeed = Math.sqrt(EARTH_MU / MOON_DISTANCE_KM); // ~0.99045 km/s
    this.moon = new CelestialBody({
      id: 'moon',
      name: 'Moon',
      mass: MOON_MASS_KG,
      mu: MOON_MU,
      radius: MOON_RADIUS_KM,
      position: this.earth.position.add(new Vector2(0, MOON_DISTANCE_KM)),
      // Velocity = Earth's velocity + tangential orbital velocity (-moonSpeed along X)
      velocity: this.earth.velocity.add(new Vector2(-moonSpeed, 0)),
      color: MOON_COLOR,
      parentBodyId: 'earth',
    });

    // 4. Spacecraft in Low Earth Orbit (LEO)
    // Initial altitude: 250 km (Radius: 1,250 km from Earth center)
    const leoAltitude = 250;
    const leoRadius = EARTH_RADIUS_KM + leoAltitude;
    // Circular orbital velocity: v = √(μ_E / r)
    const leoSpeed = Math.sqrt(EARTH_MU / leoRadius); // ~2.8014 km/s

    // Position spacecraft at (0, leoRadius) relative to Earth
    const scRelPos = new Vector2(0, leoRadius);
    // Counter-clockwise velocity is (-leoSpeed, 0)
    const scRelVel = new Vector2(-leoSpeed, 0);

    this.spacecraft = new Spacecraft({
      position: this.earth.position.add(scRelPos),
      velocity: this.earth.velocity.add(scRelVel),
      rotation: Math.PI, // Facing prograde (-X)
      throttle: 0,
      engineActive: false,
    });

    // Pre-seed initial trail point
    this.spacecraft.recordTrailPoint(this.earth.position, 0);
  }

  /**
   * Returns list of all massive celestial bodies.
   */
  get bodies(): CelestialBody[] {
    return [this.sun, this.earth, this.moon];
  }

  /**
   * Sets numerical integrator type.
   */
  setIntegrator(type: 'verlet' | 'rk4' | 'euler'): void {
    if (type === 'verlet') {
      this.integrator = new VelocityVerletIntegrator();
    } else if (type === 'rk4') {
      this.integrator = new RK4Integrator();
    } else {
      this.integrator = new SemiImplicitEulerIntegrator();
    }
  }

  /**
   * Determines the dominant celestial body (primary body) based on gravitational Sphere of Influence (SOI).
   */
  getDominantBody(pos: Vector2 = this.spacecraft.position): CelestialBody {
    // 1. Moon SOI (~1,720 km radius)
    const distToMoon = pos.dist(this.moon.position);
    const moonSoi = MOON_DISTANCE_KM * Math.pow(MOON_MU / EARTH_MU, 0.4); // ~1,720 km
    if (distToMoon <= moonSoi) {
      return this.moon;
    }

    // 2. Earth Hill Sphere / SOI (~15,500 km radius)
    const distToEarth = pos.dist(this.earth.position);
    const earthSoi = SUN_DISTANCE_KM * Math.pow(EARTH_MU / (3 * SUN_MU), 1 / 3); // ~15,530 km
    if (distToEarth <= earthSoi * 1.5) {
      return this.earth;
    }

    // 3. Otherwise Sun
    return this.sun;
  }

  /**
   * Computes current Keplerian orbital elements of the spacecraft relative to its dominant body.
   */
  getOrbitalElements(): OrbitalElements {
    const primary = this.getDominantBody();
    return calculateOrbitalElements(this.spacecraft.position, this.spacecraft.velocity, primary);
  }

  /**
   * Calculates total gravitational acceleration exerted by all celestial bodies on a point.
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
   * Advances the simulation by wall-clock dt seconds (scaled by timeWarp).
   * Uses substepping to maintain numerical stability during high time warp (up to 1000x).
   */
  update(deltaWallTime: number): void {
    if (this.isPaused || this.isCrashed) {
      return;
    }

    // Cap deltaWallTime to prevent huge jumps if browser tab loses focus
    const safeWallTime = Math.min(deltaWallTime, 0.1);
    const totalSimDt = safeWallTime * this.timeWarp;

    // Determine number of substeps needed
    // Higher time warps need smaller substeps to keep energy drift negligible
    const numSubsteps = Math.min(
      Math.max(1, Math.ceil(totalSimDt / this.maxSubstepDt)),
      400 // Safe upper bound for 60fps
    );
    const substepDt = totalSimDt / numSubsteps;

    for (let i = 0; i < numSubsteps; i++) {
      this.stepSubstep(substepDt);
      if (this.isCrashed) break;
    }

    // Record trail point periodically relative to dominant body
    const primary = this.getDominantBody();
    this.spacecraft.recordTrailPoint(primary.position, this.time);
  }

  /**
   * Single physics substep of duration dt.
   */
  private stepSubstep(dt: number): void {
    // 1. Advance Celestial Bodies:
    // Earth orbits Sun
    const earthSunAccel = this.sun.gravitationalAccelerationAt(this.earth.position);
    this.earth.velocity = this.earth.velocity.add(earthSunAccel.scale(dt));
    this.earth.position = this.earth.position.add(this.earth.velocity.scale(dt));

    // Moon orbits Earth (and Sun)
    const moonEarthAccel = this.earth.gravitationalAccelerationAt(this.moon.position);
    const moonSunAccel = this.sun.gravitationalAccelerationAt(this.moon.position);
    const moonTotalAccel = moonEarthAccel.add(moonSunAccel);
    this.moon.velocity = this.moon.velocity.add(moonTotalAccel.scale(dt));
    this.moon.position = this.moon.position.add(this.moon.velocity.scale(dt));

    // 2. Consume propellant if spacecraft engine is firing
    this.spacecraft.burnFuel(dt);

    // 3. Spacecraft integration:
    // Acceleration function closure
    const calcSpacecraftAccel = (pos: Vector2, _vel: Vector2, _t: number): Vector2 => {
      const gravAccel = this.calculateGravitationalAcceleration(pos);
      const thrustAccel = this.spacecraft.getThrustAcceleration();
      return gravAccel.add(thrustAccel);
    };

    const nextState = this.integrator.step(
      {
        position: this.spacecraft.position,
        velocity: this.spacecraft.velocity,
        acceleration: this.spacecraft.acceleration,
      },
      dt,
      this.time,
      calcSpacecraftAccel
    );

    this.spacecraft.position = nextState.position;
    this.spacecraft.velocity = nextState.velocity;
    this.spacecraft.acceleration = nextState.acceleration;

    // 4. Collision detection with celestial bodies
    for (const body of this.bodies) {
      const dist = this.spacecraft.position.dist(body.position);
      if (dist <= body.radius) {
        this.isCrashed = true;
        this.crashedBodyName = body.name;
        this.spacecraft.velocity = Vector2.zero();
        this.spacecraft.engineActive = false;
        this.spacecraft.throttle = 0;
        break;
      }
    }

    this.time += dt;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  setTimeWarp(warp: number): void {
    this.timeWarp = warp;
  }

  alignPrograde(): void {
    const primary = this.getDominantBody();
    const relVel = this.spacecraft.velocity.sub(primary.velocity);
    if (relVel.mag() > 1e-4) {
      this.spacecraft.rotation = relVel.angle();
    }
  }

  alignRetrograde(): void {
    const primary = this.getDominantBody();
    const relVel = this.spacecraft.velocity.sub(primary.velocity);
    if (relVel.mag() > 1e-4) {
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
}
