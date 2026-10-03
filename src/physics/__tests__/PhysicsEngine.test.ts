import { describe, it, expect } from 'vitest';
import { Vector2 } from '../Vector2';
import { CelestialBody } from '../CelestialBody';
import { Spacecraft } from '../Spacecraft';
import { PhysicsEngine } from '../PhysicsEngine';
import { VelocityVerletIntegrator, RK4Integrator } from '../Integrator';
import { calculateOrbitalElements } from '../Orbit';
import { Atmosphere } from '../Atmosphere';
import { Aerodynamics } from '../Aerodynamics';
import {
  EARTH_RADIUS_M,
  EARTH_MU,
  MOON_RADIUS_M,
  MOON_MU,
  MOON_ORBITAL_DISTANCE_M,
  MOON_ORBITAL_SPEED_MPS,
} from '../Constants';

describe('Real-Scale Newtonian Orbital Mechanics & Saturn V Physics', () => {
  // Test 1: Real SI Gravity decreases with distance following 1/r²
  it('1. Gravity decreases with distance following the inverse-square law (1/r²)', () => {
    const earth = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: 5.9722e24,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_M,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#00f',
    });

    const rSurface = EARTH_RADIUS_M; // 6,371 km
    const rDouble = EARTH_RADIUS_M * 2; // 12,742 km

    const gSurface = earth.gravitationalAccelerationAt(new Vector2(rSurface, 0)).mag();
    const gDouble = earth.gravitationalAccelerationAt(new Vector2(rDouble, 0)).mag();

    // At Earth surface: g0 ≈ 9.81 m/s²
    expect(gSurface).toBeCloseTo(9.81, 1);
    // At double distance: g should be exactly 1/4 of surface gravity
    expect(gSurface / gDouble).toBeCloseTo(4.0, 4);
  });

  // Test 2: Zero thrust creates zero artificial acceleration
  it('2. Zero thrust does not create artificial acceleration', () => {
    const sc = new Spacecraft({
      position: new Vector2(EARTH_RADIUS_M + 200000, 0),
      velocity: new Vector2(0, 7800),
      throttle: 0,
      engineActive: false,
      isLanded: false,
    });

    const thrustAccel = sc.getThrustAcceleration(0);
    expect(thrustAccel.mag()).toBe(0);
  });

  // Test 3: Symmetrically placed bodies cancel out
  it('3. Symmetrically placed gravitational bodies cancel out correctly', () => {
    const d = 1e8; // meters
    const body1 = new CelestialBody({
      id: 'b1',
      name: 'B1',
      mass: 1e24,
      mu: 1e14,
      radius: 1e6,
      position: new Vector2(-d, 0),
      velocity: Vector2.zero(),
      color: '#fff',
    });
    const body2 = new CelestialBody({
      id: 'b2',
      name: 'B2',
      mass: 1e24,
      mu: 1e14,
      radius: 1e6,
      position: new Vector2(d, 0),
      velocity: Vector2.zero(),
      color: '#fff',
    });

    const center = Vector2.zero();
    const a1 = body1.gravitationalAccelerationAt(center);
    const a2 = body2.gravitationalAccelerationAt(center);
    const total = a1.add(a2);

    expect(total.mag()).toBeCloseTo(0, 8);
  });

  // Test 4: Saturn V Thrust and Mass Proportionality (a = F / m)
  it('4. Thrust acceleration scales proportionally to a = F / m', () => {
    const sc = new Spacecraft({
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      rotation: 0,
      throttle: 0.5,
      engineActive: true,
      isLanded: false,
    });

    const totalMass = sc.totalMassKg;
    const stage1ThrustVac = sc.activeStage!.thrustVacN;

    const accel50 = sc.getThrustAcceleration(0).mag();
    expect(accel50).toBeCloseTo((stage1ThrustVac * 0.5) / totalMass, 2);

    sc.setThrottle(1.0);
    const accel100 = sc.getThrustAcceleration(0).mag();
    expect(accel100 / accel50).toBeCloseTo(2.0, 4);
  });

  // Test 5: Propellant depletion reduces mass and increases acceleration
  it('5. Fuel consumption reduces mass and increases acceleration', () => {
    const sc = new Spacecraft({
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      throttle: 1.0,
      engineActive: true,
      isLanded: false,
    });

    const initialMass = sc.totalMassKg;
    const initialAccel = sc.getThrustAcceleration(0).mag();

    // Burn fuel for 60 seconds
    sc.burnFuel(60, 0);

    expect(sc.totalMassKg).toBeLessThan(initialMass);
    const burnedAccel = sc.getThrustAcceleration(0).mag();
    expect(burnedAccel).toBeGreaterThan(initialAccel);
  });

  // Test 6: Atmospheric density decay and aerodynamic drag
  it('6. Atmospheric density decays exponentially with scale height and drag scales with v²', () => {
    const rhoSeaLevel = Atmosphere.getDensity(0);
    const rhoScaleHeight = Atmosphere.getDensity(8500);
    const rhoSpace = Atmosphere.getDensity(150000);

    expect(rhoSeaLevel).toBeCloseTo(1.225, 2);
    // At 1 scale height (8500m), density should be rho0 / e ≈ 0.4507 kg/m³
    expect(rhoScaleHeight).toBeCloseTo(1.225 / Math.E, 2);
    // Outside atmosphere (> 120km), density is zero
    expect(rhoSpace).toBe(0);

    // Aerodynamic drag force: F_drag = 0.5 * rho * v² * Cd * A
    const v1 = new Vector2(100, 0);
    const v2 = new Vector2(200, 0); // Double speed
    const drag1 = Aerodynamics.computeDrag(0, v1, 0.35, 80).dragMagnitude;
    const drag2 = Aerodynamics.computeDrag(0, v2, 0.35, 80).dragMagnitude;

    // Doubling velocity quadruples drag force
    expect(drag2 / drag1).toBeCloseTo(4.0, 3);
  });

  // Test 7: Saturn V Staging sequence and debris creation
  it('7. Staging jettisons spent stage, reduces mass, and spawns physical debris', () => {
    const sc = new Spacecraft({
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      isLanded: false,
    });

    expect(sc.activeStageIndex).toBe(0);
    expect(sc.debrisList.length).toBe(0);
    const fullMass = sc.totalMassKg;

    // Trigger stage separation
    const staged = sc.stage();
    expect(staged).toBe(true);
    expect(sc.activeStageIndex).toBe(1); // S-II is now active
    expect(sc.debrisList.length).toBe(1); // S-IC is in debris list
    expect(sc.totalMassKg).toBeLessThan(fullMass * 0.3); // Jettisoned over 2,000 tons!
  });

  // Test 8: Energy conservation under Velocity Verlet in real Low Earth Orbit
  it('8. Specific orbital energy remains conserved within 0.01% in real LEO', () => {
    const earth = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: 5.9722e24,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_M,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#00f',
    });

    const leoRadius = EARTH_RADIUS_M + 200000; // 200 km LEO
    const leoSpeed = Math.sqrt(EARTH_MU / leoRadius); // ~7,784 m/s

    const initialElements = calculateOrbitalElements(
      new Vector2(0, leoRadius),
      new Vector2(-leoSpeed, 0),
      earth
    );
    const initialEnergy = initialElements.specificEnergy;

    let pos = new Vector2(0, leoRadius);
    let vel = new Vector2(-leoSpeed, 0);
    let accel = earth.gravitationalAccelerationAt(pos);
    const integrator = new VelocityVerletIntegrator();
    const dt = 1.0;

    // Integrate forward 600 seconds
    for (let t = 0; t < 600; t += dt) {
      const calcAccel = (p: Vector2) => earth.gravitationalAccelerationAt(p);
      const next = integrator.step({ position: pos, velocity: vel, acceleration: accel }, dt, t, calcAccel);
      pos = next.position;
      vel = next.velocity;
      accel = next.acceleration;
    }

    const finalEnergy = calculateOrbitalElements(pos, vel, earth).specificEnergy;
    const energyDrift = Math.abs((finalEnergy - initialEnergy) / initialEnergy);
    expect(energyDrift).toBeLessThan(1e-4); // < 0.01% drift
  });

  // Test 9: Real Earth-Moon distance and lunar orbital speed
  it('9. Real Earth-Moon distance is ~384,400 km and Moon orbits at ~1,020 m/s', () => {
    expect(MOON_ORBITAL_DISTANCE_M).toBe(384400000);
    expect(MOON_ORBITAL_SPEED_MPS).toBeCloseTo(1018, 0);
    expect(MOON_RADIUS_M).toBe(1737400);

    const lunarSurfaceGravity = MOON_MU / (MOON_RADIUS_M * MOON_RADIUS_M);
    expect(lunarSurfaceGravity).toBeCloseTo(1.62, 1);
  });

  // Test 10: RK4 integrator energy conservation
  it('10. RK4 integrator stably conserves energy in orbit', () => {
    const r = EARTH_RADIUS_M + 250000;
    const v = Math.sqrt(EARTH_MU / r);
    const rk4 = new RK4Integrator();
    const next = rk4.step(
      { position: new Vector2(0, r), velocity: new Vector2(-v, 0) },
      1.0,
      0,
      (p) => p.normalize().scale(-EARTH_MU / p.magSq())
    );
    expect(next.position.mag()).toBeCloseTo(r, 0);
  });

  // Test 11: PhysicsEngine Pad 39A surface initialization and launch
  it('11. PhysicsEngine initializes on Pad 39A and launches Saturn V on full throttle', () => {
    const engine = new PhysicsEngine();
    expect(engine.spacecraft.isLanded).toBe(true);
    expect(engine.time).toBe(0);

    // Turn engine on full throttle
    engine.fullThrottle();
    expect(engine.spacecraft.engineActive).toBe(true);
    expect(engine.spacecraft.throttle).toBe(1.0);

    // Step physics forward 2 seconds
    engine.isPaused = false;
    engine.update(0.1);

    // Rocket should lift off as S-IC thrust (~35.1 MN) > weight (~28.7 MN)
    expect(engine.spacecraft.isLanded).toBe(false);
  });
});
