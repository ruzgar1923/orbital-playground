import { Vector2 } from './Vector2';
import { CelestialBody } from './CelestialBody';

export interface OrbitalElements {
  primaryBody: CelestialBody;
  distance: number; // meters from body center
  altitude: number; // meters from body surface
  speed: number; // m/s relative to body
  radialVelocity: number; // m/s (vertical velocity)
  tangentialVelocity: number; // m/s (horizontal velocity)
  specificEnergy: number; // J/kg (m²/s²)
  angularMomentum: number; // m²/s
  eccentricity: number; // e
  eccentricityVector: Vector2;
  semiMajorAxis: number; // meters (a)
  periapsisDistance: number; // meters
  periapsisAltitude: number; // meters
  apoapsisDistance: number | null; // meters
  apoapsisAltitude: number | null; // meters
  periodSeconds: number | null; // seconds
  isHyperbolic: boolean;
  isSuborbital: boolean; // Periapsis penetrates surface
  argumentOfPeriapsis: number; // radians
  trueAnomaly: number; // radians
  periapsisPosition: Vector2;
  apoapsisPosition: Vector2 | null;
}

/**
 * Calculates Keplerian orbital elements in real SI units (meters, m/s).
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
  const radialVelocity = r > 1e-4 ? relPos.dot(relVel) / r : 0;

  // Specific angular momentum: h = r × v
  const hScalar = relPos.cross(relVel);
  const angularMomentum = Math.abs(hScalar);
  const tangentialVelocity = r > 1e-4 ? angularMomentum / r : 0;

  // Specific orbital energy: ε = v² / 2 - μ / r
  const specificEnergy = (v * v) / 2 - mu / Math.max(r, 1.0);

  // Semi-major axis: a = -μ / (2ε)
  const semiMajorAxis = Math.abs(specificEnergy) > 1e-9 ? -mu / (2 * specificEnergy) : 0;

  // Eccentricity vector: e = (1 / μ) * [ (v² - μ/r) r - (r · v) v ]
  const vSq = v * v;
  const term1 = relPos.scale(vSq - mu / Math.max(r, 1.0));
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
    apoapsisDistance = p / (1 - eccentricity);
    apoapsisAltitude = apoapsisDistance - bodyRadius;
    periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
  }

  const isSuborbital = periapsisAltitude < 0;

  // Argument of periapsis
  const argumentOfPeriapsis = eccVec.mag() > 1e-6 ? eccVec.angle() : 0;

  // True anomaly
  let trueAnomaly = 0;
  if (eccVec.mag() > 1e-6 && r > 1e-6) {
    const cosNu = Math.max(-1, Math.min(1, relPos.dot(eccVec) / (r * eccentricity)));
    trueAnomaly = Math.acos(cosNu);
    if (relPos.cross(eccVec) > 0) {
      trueAnomaly = 2 * Math.PI - trueAnomaly;
    }
  }

  const periapsisDir = eccentricity > 1e-6 ? eccVec.normalize() : relPos.normalize();
  const periapsisPosition = primaryBody.position.add(periapsisDir.scale(periapsisDistance));

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
    isSuborbital,
    argumentOfPeriapsis,
    trueAnomaly,
    periapsisPosition,
    apoapsisPosition,
  };
}

/**
 * Generates an array of world-space points in meters for rendering the osculating orbit line.
 */
export function getOsculatingOrbitPoints(
  elements: OrbitalElements,
  samples = 140
): Vector2[] {
  const { primaryBody, periapsisDistance, eccentricity, argumentOfPeriapsis, isHyperbolic } =
    elements;

  const points: Vector2[] = [];
  const p = periapsisDistance * (1 + eccentricity);

  if (p <= 0) return points;

  if (!isHyperbolic) {
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
    // Asymptote angle: nu_inf = acos(-1 / e)
    const maxNu = Math.min(Math.PI * 0.85, Math.acos(-1 / Math.max(1.0001, eccentricity)) * 0.88);
    const startNu = -maxNu;
    const endNu = maxNu;
    const step = (endNu - startNu) / samples;

    for (let i = 0; i <= samples; i++) {
      const nu = startNu + i * step;
      const denom = 1 + eccentricity * Math.cos(nu);
      if (denom <= 0.05) continue;
      const r = p / denom;
      // Cap render distance to reasonable limit (e.g. 5x Moon distance)
      if (r > 2e9) continue;

      const theta = nu + argumentOfPeriapsis;
      const x = primaryBody.position.x + r * Math.cos(theta);
      const y = primaryBody.position.y + r * Math.sin(theta);
      points.push(new Vector2(x, y));
    }
  }

  return points;
}
