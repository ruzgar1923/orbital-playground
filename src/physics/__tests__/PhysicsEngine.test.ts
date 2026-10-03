import { describe, it, expect } from 'vitest';
import { Vector2 } from '../Vector2';
import { CelestialBody } from '../CelestialBody';
import { Spacecraft } from '../Spacecraft';
import { PhysicsEngine } from '../PhysicsEngine';
import { VelocityVerletIntegrator, RK4Integrator } from '../Integrator';
import { calculateOrbitalElements } from '../Orbit';
import { EARTH_RADIUS_KM, EARTH_MU } from '../Constants';

describe('Orbital Mechanics Physics Engine', () => {
  // Test 1: Gravity decreases with distance (Newton's inverse-square law)
  it('1. Gravity decreases with distance following the inverse-square law', () => {
    const body = new CelestialBody({
      id: 'test-body',
      name: 'Test Body',
      mass: 1e20,
      mu: 10000,
      radius: 500,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#fff',
    });

    const r1 = 1000; // km
    const r2 = 2000; // km (double distance)
    const r3 = 4000; // km (quadruple distance)

    const a1 = body.gravitationalAccelerationAt(new Vector2(r1, 0)).mag();
    const a2 = body.gravitationalAccelerationAt(new Vector2(r2, 0)).mag();
    const a3 = body.gravitationalAccelerationAt(new Vector2(r3, 0)).mag();

    // a = μ / r² => doubling distance reduces gravity by 4x
    expect(a1).toBeGreaterThan(a2);
    expect(a2).toBeGreaterThan(a3);
    expect(a1 / a2).toBeCloseTo(4.0, 4);
    expect(a1 / a3).toBeCloseTo(16.0, 4);
  });

  // Test 2: Zero thrust does not create artificial acceleration
  it('2. Zero thrust does not create artificial acceleration', () => {
    const sc = new Spacecraft({
      position: new Vector2(5000, 5000),
      velocity: new Vector2(1, 0),
      throttle: 0,
      engineActive: false,
    });

    const thrustAccel = sc.getThrustAcceleration();
    expect(thrustAccel.x).toBe(0);
    expect(thrustAccel.y).toBe(0);
    expect(thrustAccel.mag()).toBe(0);

    // Even if engine is toggled on, if throttle is 0, thrust is 0
    sc.engineActive = true;
    sc.throttle = 0;
    expect(sc.getThrustAcceleration().mag()).toBe(0);
  });

  // Test 3: Symmetric gravitational situations behave correctly
  it('3. Symmetric gravitational situations cancel out correctly', () => {
    // Two identical massive bodies placed symmetrically along the X-axis
    const d = 5000; // km
    const body1 = new CelestialBody({
      id: 'body-1',
      name: 'Body 1',
      mass: 1e22,
      mu: 5000,
      radius: 500,
      position: new Vector2(-d, 0),
      velocity: Vector2.zero(),
      color: '#fff',
    });
    const body2 = new CelestialBody({
      id: 'body-2',
      name: 'Body 2',
      mass: 1e22,
      mu: 5000,
      radius: 500,
      position: new Vector2(d, 0),
      velocity: Vector2.zero(),
      color: '#fff',
    });

    // Test point exactly in the middle at (0, 0)
    const midPoint = Vector2.zero();
    const a1 = body1.gravitationalAccelerationAt(midPoint);
    const a2 = body2.gravitationalAccelerationAt(midPoint);
    const totalMid = a1.add(a2);

    expect(totalMid.mag()).toBeCloseTo(0, 8);

    // Test point on the perpendicular bisector (0, 1000)
    // The X components must cancel out, net force must be along +Y
    const perpPoint = new Vector2(0, 1000);
    const aPerp1 = body1.gravitationalAccelerationAt(perpPoint);
    const aPerp2 = body2.gravitationalAccelerationAt(perpPoint);
    const totalPerp = aPerp1.add(aPerp2);

    expect(totalPerp.x).toBeCloseTo(0, 8);
    // Gravitational pull is directed towards the bodies (in -Y direction)
    expect(totalPerp.y).toBeLessThan(0);
  });

  // Test 4: Increasing thrust increases acceleration (a = F / m)
  it('4. Increasing thrust increases acceleration proportionally to a = F / m', () => {
    const sc = new Spacecraft({
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      rotation: 0, // Heading along +X
      dryMass: 1000,
      fuelMass: 500,
      maxThrust: 15.0, // 15 kN
      engineActive: true,
      throttle: 0.25,
    });

    const m = sc.totalMass; // 1500 kg
    const a25 = sc.getThrustAcceleration().mag();
    expect(a25).toBeCloseTo((15.0 * 0.25) / m, 6);

    sc.setThrottle(0.5);
    const a50 = sc.getThrustAcceleration().mag();
    expect(a50).toBeCloseTo((15.0 * 0.5) / m, 6);
    expect(a50 / a25).toBeCloseTo(2.0, 4);

    sc.setThrottle(1.0);
    const a100 = sc.getThrustAcceleration().mag();
    expect(a100).toBeCloseTo(15.0 / m, 6);
    expect(a100 / a50).toBeCloseTo(2.0, 4);

    // Propellant consumption reduces mass, increasing acceleration
    sc.burnFuel(50); // Burn fuel
    expect(sc.totalMass).toBeLessThan(m);
    const aBurned = sc.getThrustAcceleration().mag();
    expect(aBurned).toBeGreaterThan(a100);
  });

  // Test 5: A spacecraft in a reasonable circular orbit remains approximately bounded
  it('5. A spacecraft in a circular orbit remains approximately bounded over time', () => {
    const body = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: 1e23,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_KM,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#00f',
    });

    const orbitRadius = 1250; // km
    const circularSpeed = Math.sqrt(EARTH_MU / orbitRadius); // ~2.8014 km/s
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / EARTH_MU); // ~2804 s

    let pos = new Vector2(0, orbitRadius);
    let vel = new Vector2(-circularSpeed, 0);
    let accel = body.gravitationalAccelerationAt(pos);

    const integrator = new VelocityVerletIntegrator();
    const dt = 1.0; // 1 second steps
    const totalSteps = Math.floor(orbitalPeriod); // 1 full orbit

    let minR = orbitRadius;
    let maxR = orbitRadius;

    for (let step = 0; step < totalSteps; step++) {
      const calcAccel = (p: Vector2) => body.gravitationalAccelerationAt(p);
      const next = integrator.step({ position: pos, velocity: vel, acceleration: accel }, dt, step * dt, calcAccel);
      pos = next.position;
      vel = next.velocity;
      accel = next.acceleration;

      const r = pos.mag();
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
    }

    // After 1 full orbit, radius should stay within 0.1% of original radius
    expect(minR).toBeGreaterThan(orbitRadius * 0.999);
    expect(maxR).toBeLessThan(orbitRadius * 1.001);
    expect(pos.dist(new Vector2(0, orbitRadius))).toBeLessThan(10); // within 10 km of start after 2,800 km orbit
  });

  // Test 6: Energy remains reasonably stable for a simple orbit
  it('6. Specific orbital energy remains stable for an orbit', () => {
    const body = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: 1e23,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_KM,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#00f',
    });

    const orbitRadius = 1250; // km
    const circularSpeed = Math.sqrt(EARTH_MU / orbitRadius);
    const initialElements = calculateOrbitalElements(
      new Vector2(0, orbitRadius),
      new Vector2(-circularSpeed, 0),
      body
    );

    const initialEnergy = initialElements.specificEnergy;
    expect(initialEnergy).toBeLessThan(0); // Bound orbit has negative energy

    let pos = new Vector2(0, orbitRadius);
    let vel = new Vector2(-circularSpeed, 0);
    let accel = body.gravitationalAccelerationAt(pos);
    const integrator = new VelocityVerletIntegrator();
    const dt = 0.5;

    // Simulate for 500 seconds (~18% of full orbit)
    for (let t = 0; t < 500; t += dt) {
      const calcAccel = (p: Vector2) => body.gravitationalAccelerationAt(p);
      const next = integrator.step({ position: pos, velocity: vel, acceleration: accel }, dt, t, calcAccel);
      pos = next.position;
      vel = next.velocity;
      accel = next.acceleration;
    }

    const finalElements = calculateOrbitalElements(pos, vel, body);
    const finalEnergy = finalElements.specificEnergy;

    // Relative energy drift should be less than 0.01%
    const energyError = Math.abs((finalEnergy - initialEnergy) / initialEnergy);
    expect(energyError).toBeLessThan(1e-4);
  });

  it('7. RK4 integrator also conserves energy stably', () => {
    const body = new CelestialBody({
      id: 'earth',
      name: 'Earth',
      mass: 1e23,
      mu: EARTH_MU,
      radius: EARTH_RADIUS_KM,
      position: Vector2.zero(),
      velocity: Vector2.zero(),
      color: '#00f',
    });

    const orbitRadius = 1250;
    const circularSpeed = Math.sqrt(EARTH_MU / orbitRadius);
    const initialEnergy = calculateOrbitalElements(
      new Vector2(0, orbitRadius),
      new Vector2(-circularSpeed, 0),
      body
    ).specificEnergy;

    let pos = new Vector2(0, orbitRadius);
    let vel = new Vector2(-circularSpeed, 0);
    const integrator = new RK4Integrator();
    const dt = 0.5;

    for (let t = 0; t < 200; t += dt) {
      const calcAccel = (p: Vector2) => body.gravitationalAccelerationAt(p);
      const next = integrator.step({ position: pos, velocity: vel }, dt, t, calcAccel);
      pos = next.position;
      vel = next.velocity;
    }

    const finalEnergy = calculateOrbitalElements(pos, vel, body).specificEnergy;
    const energyError = Math.abs((finalEnergy - initialEnergy) / initialEnergy);
    expect(energyError).toBeLessThan(1e-4);
  });

  it('8. Full PhysicsEngine initializes in Low Earth Orbit and responds to time warp updates', () => {
    const engine = new PhysicsEngine();
    expect(engine.isPaused).toBe(true);
    expect(engine.bodies.length).toBe(3);

    const initialPos = engine.spacecraft.position.clone();
    engine.isPaused = false;
    engine.timeWarp = 10;
    engine.update(0.1); // step forward 1 second of sim time

    // Spacecraft should have moved
    expect(engine.spacecraft.position.dist(initialPos)).toBeGreaterThan(0);
    expect(engine.time).toBeGreaterThan(0);
  });
});
