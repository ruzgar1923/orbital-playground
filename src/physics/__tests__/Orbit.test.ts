import { describe, it, expect } from 'vitest';
import { Vector2 } from '../Vector2';
import { CelestialBody } from '../CelestialBody';
import { calculateOrbitalElements, getOsculatingOrbitPoints } from '../Orbit';
import { EARTH_RADIUS_M, EARTH_MU } from '../Constants';

describe('Real SI Orbital Elements & Conic Math', () => {
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

  it('correctly calculates Low Earth Orbit parameters in real SI meters', () => {
    const r = EARTH_RADIUS_M + 250000; // 250 km LEO altitude
    const v = Math.sqrt(EARTH_MU / r); // circular speed ~7,755 m/s
    const elements = calculateOrbitalElements(new Vector2(0, r), new Vector2(-v, 0), earth);

    expect(elements.altitude).toBeCloseTo(250000, 0);
    expect(elements.speed).toBeCloseTo(v, 1);
    expect(elements.eccentricity).toBeCloseTo(0, 4);
    expect(elements.isHyperbolic).toBe(false);
    expect(elements.periapsisAltitude).toBeCloseTo(250000, 0);
    expect(elements.apoapsisAltitude).toBeCloseTo(250000, 0);
    expect(elements.periodSeconds).toBeGreaterThan(5300); // ~90 minutes
  });

  it('detects hyperbolic escape trajectory when speed exceeds Earth escape velocity (~11.2 km/s)', () => {
    const r = EARTH_RADIUS_M + 250000;
    const vCirc = Math.sqrt(EARTH_MU / r);
    const vEscape = Math.sqrt(2) * vCirc; // ~10,967 m/s at 250 km altitude

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

    const points = getOsculatingOrbitPoints(elements, 60);
    expect(points.length).toBeGreaterThan(10);
  });
});
