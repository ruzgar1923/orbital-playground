import { describe, it, expect } from 'vitest';
import { Vector2 } from '../Vector2';
import { CelestialBody } from '../CelestialBody';
import { calculateOrbitalElements, getOsculatingOrbitPoints } from '../Orbit';
import { EARTH_RADIUS_KM, EARTH_MU } from '../Constants';

describe('Orbital Elements & Conic Math', () => {
  const earth = new CelestialBody({
    id: 'earth',
    name: 'Earth',
    mass: 1e23,
    mu: EARTH_MU, // 9810
    radius: EARTH_RADIUS_KM, // 1000
    position: Vector2.zero(),
    velocity: Vector2.zero(),
    color: '#00f',
  });

  it('correctly calculates low circular orbit parameters', () => {
    const r = 1250; // km (alt 250 km)
    const v = Math.sqrt(EARTH_MU / r); // circular speed ~2.8014 km/s
    const elements = calculateOrbitalElements(new Vector2(0, r), new Vector2(-v, 0), earth);

    expect(elements.altitude).toBeCloseTo(250, 4);
    expect(elements.speed).toBeCloseTo(v, 4);
    expect(elements.eccentricity).toBeCloseTo(0, 4);
    expect(elements.isHyperbolic).toBe(false);
    expect(elements.periapsisAltitude).toBeCloseTo(250, 2);
    expect(elements.apoapsisAltitude).toBeCloseTo(250, 2);
    expect(elements.periodSeconds).toBeGreaterThan(2700);
  });

  it('detects hyperbolic escape trajectory when speed exceeds escape velocity', () => {
    const r = 1250;
    const vCirc = Math.sqrt(EARTH_MU / r);
    const vEscape = Math.sqrt(2) * vCirc; // Escape speed ~3.96 km/s

    // Speed 10% greater than escape velocity
    const vHyperbolic = vEscape * 1.1;
    const elements = calculateOrbitalElements(
      new Vector2(0, r),
      new Vector2(-vHyperbolic, 0),
      earth
    );

    expect(elements.isHyperbolic).toBe(true);
    expect(elements.eccentricity).toBeGreaterThan(1.0);
    expect(elements.specificEnergy).toBeGreaterThan(0);
    expect(elements.apoapsisAltitude).toBeNull();
    expect(elements.periodSeconds).toBeNull();

    // Conic sampling should return valid points
    const points = getOsculatingOrbitPoints(elements, 60);
    expect(points.length).toBeGreaterThan(10);
  });

  it('correctly computes vertical and horizontal velocities', () => {
    const r = 2000;
    // Velocity with both radial (+1 km/s) and tangential (+2 km/s) components
    const pos = new Vector2(r, 0);
    const vel = new Vector2(1, 2);
    const elements = calculateOrbitalElements(pos, vel, earth);

    expect(elements.radialVelocity).toBeCloseTo(1, 4);
    expect(elements.tangentialVelocity).toBeCloseTo(2, 4);
    expect(elements.speed).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2), 4);
  });
});
