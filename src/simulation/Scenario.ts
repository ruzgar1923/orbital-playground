import { Vector2 } from '../physics/Vector2';
import { Spacecraft } from '../physics/Spacecraft';
import { CelestialBody } from '../physics/CelestialBody';
import {
  EARTH_RADIUS_M,
  EARTH_MU,
  MOON_RADIUS_M,
  MOON_MU,
  KSC_PAD_LATITUDE_DEG,
  KSC_PAD_SURFACE_VELOCITY_MPS,
} from '../physics/Constants';

export interface MissionScenario {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  objectives: string[];
  setup(earth: CelestialBody, moon: CelestialBody): Spacecraft;
  checkCompletion(sc: Spacecraft, earth: CelestialBody, moon: CelestialBody): {
    completed: boolean;
    progress: string;
  };
}

export const SCENARIOS: MissionScenario[] = [
  {
    id: 'mission_01',
    number: 'MISSION 01',
    title: 'Earth Orbit (Launch to LEO)',
    subtitle: 'Surface Launch & Orbital Insertion',
    description:
      'Launch the Saturn V from Kennedy Space Center (Pad 39A). Perform an aerodynamic gravity turn to the East, clear the atmosphere, and enter a stable circular Low Earth Orbit (LEO) above 180 km.',
    objectives: [
      'Ignite S-IC first stage at 100% throttle',
      'Pitch over to 45° around 15 km altitude',
      'Stage S-IC and S-II when fuel is depleted',
      'Achieve stable orbit: Periapsis > 160 km, Velocity ~7.8 km/s',
    ],
    setup(earth: CelestialBody) {
      // Pad 39A on Earth surface at latitude 28.5°
      const padAngleRad = (KSC_PAD_LATITUDE_DEG * Math.PI) / 180;
      // Normal vector from Earth center to surface
      const surfaceNorm = new Vector2(Math.cos(padAngleRad), Math.sin(padAngleRad));
      const pos = earth.position.add(surfaceNorm.scale(EARTH_RADIUS_M + 1.0));

      // Initial velocity equals Earth surface rotation (~408 m/s tangential to surface)
      const tangDir = new Vector2(-surfaceNorm.y, surfaceNorm.x);
      const vel = earth.velocity.add(tangDir.scale(KSC_PAD_SURFACE_VELOCITY_MPS));

      // Heading pointing radially upward from surface
      const sc = new Spacecraft({
        position: pos,
        velocity: vel,
        rotation: padAngleRad, // Pointing up
        throttle: 0,
        engineActive: false,
        isLanded: true,
      });
      sc.landedBodyId = 'earth';
      sc.landedSurfaceAngle = padAngleRad;
      return sc;
    },
    checkCompletion(sc: Spacecraft, earth: CelestialBody) {
      const relPos = sc.position.sub(earth.position);
      const relVel = sc.velocity.sub(earth.velocity);
      const r = relPos.mag();
      const v = relVel.mag();
      const alt = r - EARTH_RADIUS_M;

      const eps = (v * v) / 2 - EARTH_MU / r;
      const hScalar = Math.abs(relPos.cross(relVel));
      const p = (hScalar * hScalar) / EARTH_MU;
      const e = Math.sqrt(Math.max(0, 1 + (2 * eps * hScalar * hScalar) / (EARTH_MU * EARTH_MU)));
      const periapsisAlt = p / (1 + e) - EARTH_RADIUS_M;

      if (periapsisAlt > 160000 && alt > 160000 && e < 0.15) {
        return { completed: true, progress: 'Stable Low Earth Orbit achieved!' };
      }
      return {
        completed: false,
        progress: `Alt: ${(alt / 1000).toFixed(0)} km | Periapsis: ${(periapsisAlt / 1000).toFixed(0)} km | Speed: ${(v / 1000).toFixed(2)} km/s`,
      };
    },
  },

  {
    id: 'mission_02',
    number: 'MISSION 02',
    title: 'Translunar Injection (TLI)',
    subtitle: 'Earth Escape & Lunar Transfer Burn',
    description:
      'Begin in Low Earth Orbit with the S-IVB stage. Perform a prograde burn to increase velocity from 7.8 km/s to ~10.8 km/s, sending the spacecraft onto a free-return trajectory toward the Moon.',
    objectives: [
      'Orient prograde along orbital velocity vector',
      'Ignite S-IVB stage and accelerate to ~10.8 km/s',
      'Raise Apoapsis to lunar orbital distance (~384,000 km)',
      'Enter the Moon’s Sphere of Influence (SOI)',
    ],
    setup(earth: CelestialBody) {
      const leoRadius = EARTH_RADIUS_M + 200000; // 200 km LEO
      const leoSpeed = Math.sqrt(EARTH_MU / leoRadius); // ~7.78 km/s

      const pos = earth.position.add(new Vector2(0, leoRadius));
      const vel = earth.velocity.add(new Vector2(-leoSpeed, 0));

      const sc = new Spacecraft({
        position: pos,
        velocity: vel,
        rotation: Math.PI, // Facing prograde (-X)
        throttle: 0,
        engineActive: false,
        isLanded: false,
      });
      // Start at S-IVB third stage
      sc.activeStageIndex = 2;
      return sc;
    },
    checkCompletion(sc: Spacecraft, _earth: CelestialBody, moon: CelestialBody) {
      const distToMoon = sc.position.dist(moon.position);
      if (distToMoon < 66000000) {
        return { completed: true, progress: 'Entered Moon Sphere of Influence (SOI)!' };
      }
      return {
        completed: false,
        progress: `Distance to Moon: ${(distToMoon / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} km`,
      };
    },
  },

  {
    id: 'mission_03',
    number: 'MISSION 03',
    title: 'Lunar Orbit Insertion (LOI)',
    subtitle: 'Capture into Low Lunar Orbit',
    description:
      'Arriving at the Moon on a hyperbolic flyby trajectory. Fire the Apollo Service Propulsion System (SPS) retrograde to decelerate into a stable 100 km circular lunar orbit.',
    objectives: [
      'Orient retrograde relative to Moon velocity vector',
      'Fire SPS engine near Periapsis (~100 km above lunar surface)',
      'Reduce eccentricity below 0.05 to circularize orbit',
    ],
    setup(_earth: CelestialBody, moon: CelestialBody) {
      // Approach from ahead of the Moon
      const loiAlt = 100000; // 100 km lunar altitude
      const r = MOON_RADIUS_M + loiAlt;
      // Hyperbolic approach speed ~2,200 m/s relative to Moon
      const approachSpeed = 2250;

      const pos = moon.position.add(new Vector2(0, r));
      const vel = moon.velocity.add(new Vector2(-approachSpeed, 0));

      const sc = new Spacecraft({
        position: pos,
        velocity: vel,
        rotation: 0, // Facing retrograde (+X to decelerate)
        throttle: 0,
        engineActive: false,
        isLanded: false,
      });
      // Apollo CSM/LM active
      sc.activeStageIndex = 3;
      return sc;
    },
    checkCompletion(sc: Spacecraft, _earth: CelestialBody, moon: CelestialBody) {
      const relPos = sc.position.sub(moon.position);
      const relVel = sc.velocity.sub(moon.velocity);
      const r = relPos.mag();
      const v = relVel.mag();
      const alt = r - MOON_RADIUS_M;

      const eps = (v * v) / 2 - MOON_MU / r;
      const hScalar = Math.abs(relPos.cross(relVel));
      const e = Math.sqrt(Math.max(0, 1 + (2 * eps * hScalar * hScalar) / (MOON_MU * MOON_MU)));

      if (eps < 0 && e < 0.1 && alt < 300000 && alt > 50000) {
        return { completed: true, progress: 'Stable Low Lunar Orbit achieved!' };
      }
      return {
        completed: false,
        progress: `Moon Alt: ${(alt / 1000).toFixed(1)} km | Speed: ${v.toFixed(0)} m/s | e: ${e.toFixed(3)}`,
      };
    },
  },

  {
    id: 'mission_04',
    number: 'MISSION 04',
    title: 'Lunar Landing',
    subtitle: 'Powered Lunar Descent & Touchdown',
    description:
      'Begin at 5,000 meters altitude above the Moon in the lunar module. Control throttle and pitch to kill horizontal velocity, manage your vertical descent rate, and touch down safely on the lunar surface (< 4 m/s).',
    objectives: [
      'Cancel horizontal velocity with retrograde thrust',
      'Throttle down during final descent below 500 m',
      'Touch down at vertical speed < 4.0 m/s and horizontal speed < 1.5 m/s',
    ],
    setup(_earth: CelestialBody, moon: CelestialBody) {
      // 5 km altitude above Moon surface
      const alt = 5000;
      const r = MOON_RADIUS_M + alt;

      const pos = moon.position.add(new Vector2(0, r));
      // Modest residual velocity (~80 m/s horizontal, -15 m/s vertical descent)
      const vel = moon.velocity.add(new Vector2(-80, -15));

      const sc = new Spacecraft({
        position: pos,
        velocity: vel,
        rotation: Math.PI / 2, // Pointing up
        throttle: 0.35,
        engineActive: true,
        isLanded: false,
      });
      sc.activeStageIndex = 3;
      return sc;
    },
    checkCompletion(sc: Spacecraft, _earth: CelestialBody, moon: CelestialBody) {
      const relPos = sc.position.sub(moon.position);
      const relVel = sc.velocity.sub(moon.velocity);
      const r = relPos.mag();
      const alt = r - MOON_RADIUS_M;
      const speed = relVel.mag();

      if (sc.isLanded && alt <= 2.0 && speed < 4.0) {
        return { completed: true, progress: 'The Eagle has landed! Safe lunar touchdown!' };
      }
      return {
        completed: false,
        progress: `Lunar Alt: ${alt.toFixed(1)} m | Descent Speed: ${speed.toFixed(1)} m/s`,
      };
    },
  },
];
