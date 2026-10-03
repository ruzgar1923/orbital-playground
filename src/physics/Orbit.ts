import { Vector2 } from './Vector2';
import { CelestialBody } from './CelestialBody';

export interface OrbitalElements {
  primaryBody: CelestialBody;
  distance: number; // km (from body center)
  altitude: number; // km (from body surface)
  speed: number; // km/s (relative to body)
  radialVelocity: number; // km/s (vertical velocity)
  tangentialVelocity: number; // km/s (horizontal velocity)
  specificEnergy: number; // km²/s² (epsilon)
  angularMomentum: number; // km²/s (h)
  eccentricity: number; // e
  eccentricityVector: Vector2;
  semiMajorAxis: number; // a (km, negative for hyperbola)
  periapsisDistance: number; // r_p (km)
  periapsisAltitude: number; // h_p (km)
  apoapsisDistance: number | null; // r_a (km, null for hyperbolic)
  apoapsisAltitude: number | null; // h_a (km, null for hyperbolic)
  periodSeconds: number | null; // T in seconds (null for hyperbolic)
  isHyperbolic: boolean;
  argumentOfPeriapsis: number; // omega (radians)
  trueAnomaly: number; // nu (radians)
  periapsisPosition: Vector2;
  apoapsisPosition: Vector2 | null;
}

/**
 * Calculates Keplerian orbital elements of a spacecraft relative to a primary celestial body.
 */
export function calculateOrbitalElements(
  scPosition: Vector2,
  scVelocity: Vector2,
  primaryBody: CelestialBody
): OrbitalElements {
  const relPos = scPosition.sub(primaryBody.position);
  const relVel = scVelocity.sub(primaryBody.velocity);

  const r = relPos.mag();
  const v = relVel.mag();
  const mu = primaryBody.mu;
  const bodyRadius = primaryBody.radius;

  const altitude = r - bodyRadius;

  // Radial velocity (vertical): v_r = (r · v) / r
  const radialVelocity = r > 1e-6 ? relPos.dot(relVel) / r : 0;

  // Tangential velocity (horizontal): v_t = |r × v| / r
  const hScalar = relPos.cross(relVel); // specific angular momentum z
  const tangentialVelocity = r > 1e-6 ? Math.abs(hScalar) / r : 0;
  const angularMomentum = Math.abs(hScalar);

  // Specific orbital energy: ε = v² / 2 - μ / r
  const specificEnergy = (v * v) / 2 - mu / Math.max(r, 1e-4);

  // Semi-major axis: a = -μ / (2ε)
  const semiMajorAxis = Math.abs(specificEnergy) > 1e-9 ? -mu / (2 * specificEnergy) : 0;

  // Eccentricity vector: e = (1 / μ) * [ (v² - μ/r) r - (r · v) v ]
  const vSq = v * v;
  const term1 = relPos.scale(vSq - mu / Math.max(r, 1e-4));
  const term2 = relVel.scale(relPos.dot(relVel));
  const eccVec = term1.sub(term2).div(mu);
  const eccentricity = eccVec.mag();

  const isHyperbolic = eccentricity >= 1.0 || specificEnergy >= 0;

  // Semi-latus rectum: p = h² / μ
  const p = (hScalar * hScalar) / mu;

  // Periapsis distance: r_p = p / (1 + e)
  const periapsisDistance = eccentricity !== -1 ? p / (1 + eccentricity) : 0;
  const periapsisAltitude = periapsisDistance - bodyRadius;

  let apoapsisDistance: number | null = null;
  let apoapsisAltitude: number | null = null;
  let periodSeconds: number | null = null;

  if (!isHyperbolic && eccentricity < 0.9999 && semiMajorAxis > 0) {
    // Apoapsis distance: r_a = p / (1 - e) = a * (1 + e)
    apoapsisDistance = p / (1 - eccentricity);
    apoapsisAltitude = apoapsisDistance - bodyRadius;

    // Orbital period: T = 2π √(a³ / μ)
    periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
  }

  // Argument of periapsis: angle of eccentricity vector
  const argumentOfPeriapsis = eccVec.mag() > 1e-6 ? eccVec.angle() : 0;

  // True anomaly: angle between eccentricity vector and position vector
  let trueAnomaly = 0;
  if (eccVec.mag() > 1e-6 && r > 1e-6) {
    const cosNu = Math.max(-1, Math.min(1, relPos.dot(eccVec) / (r * eccentricity)));
    trueAnomaly = Math.acos(cosNu);
    if (relPos.cross(eccVec) > 0) {
      trueAnomaly = 2 * Math.PI - trueAnomaly;
    }
  }

  // Periapsis position in space (relative to primary body pos)
  const periapsisDir =
    eccentricity > 1e-6
      ? eccVec.normalize()
      : relPos.normalize();
  const periapsisPosition = primaryBody.position.add(periapsisDir.scale(periapsisDistance));

  // Apoapsis position
  let apoapsisPosition: Vector2 | null = null;
  if (apoapsisDistance !== null) {
    const apoapsisDir = periapsisDir.scale(-1);
    apoapsisPosition = primaryBody.position.add(apoapsisDir.scale(apoapsisDistance));
  }

  return {
    primaryBody,
    distance: r,
    altitude,
    speed: v,
    radialVelocity,
    tangentialVelocity,
    specificEnergy,
    angularMomentum,
    eccentricity,
    eccentricityVector: eccVec,
    semiMajorAxis,
    periapsisDistance,
    periapsisAltitude,
    apoapsisDistance,
    apoapsisAltitude,
    periodSeconds,
    isHyperbolic,
    argumentOfPeriapsis,
    trueAnomaly,
    periapsisPosition,
    apoapsisPosition,
  };
}

/**
 * Generates an array of 2D coordinates (in world km) representing the projected
 * osculating conic section (ellipse or hyperbola) for rendering on the canvas.
 */
export function getOsculatingOrbitPoints(
  elements: OrbitalElements,
  samples = 120
): Vector2[] {
  const { primaryBody, periapsisDistance, eccentricity, argumentOfPeriapsis, isHyperbolic } =
    elements;

  const points: Vector2[] = [];
  const p = periapsisDistance * (1 + eccentricity); // semi-latus rectum

  if (p <= 0) return points;

  if (!isHyperbolic) {
    // Ellipse: sweep full true anomaly 0 to 2π
    const step = (2 * Math.PI) / samples;
    for (let i = 0; i <= samples; i++) {
      const nu = i * step;
      const r = p / (1 + eccentricity * Math.cos(nu));
      const theta = nu + argumentOfPeriapsis;
      const x = primaryBody.position.x + r * Math.cos(theta);
      const y = primaryBody.position.y + r * Math.sin(theta);
      points.push(new Vector2(x, y));
    }
  } else {
    // Hyperbola: sweep between asymptotes
    // Limit to ±85% of asymptotic true anomaly
    const maxNu = Math.min(Math.PI * 0.85, Math.acos(-1 / Math.max(1.0001, eccentricity)) * 0.88);
    const startNu = -maxNu;
    const endNu = maxNu;
    const step = (endNu - startNu) / samples;

    for (let i = 0; i <= samples; i++) {
      const nu = startNu + i * step;
      const denom = 1 + eccentricity * Math.cos(nu);
      if (denom <= 0.05) continue;
      const r = p / denom;
      // Cap render distance to reasonable screen boundary (e.g. 10x periapsis or 50,000 km)
      if (r > Math.max(50000, periapsisDistance * 20)) continue;

      const theta = nu + argumentOfPeriapsis;
      const x = primaryBody.position.x + r * Math.cos(theta);
      const y = primaryBody.position.y + r * Math.sin(theta);
      points.push(new Vector2(x, y));
    }
  }

  return points;
}
