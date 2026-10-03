/**
 * Central scientific constants and physical parameters for Orbital Playground.
 * ALL values are defined strictly in SI units:
 * - Distance: meters (m)
 * - Mass: kilograms (kg)
 * - Time: seconds (s)
 * - Velocity: meters per second (m/s)
 * - Force: Newtons (N)
 * - Energy: Joules (J)
 *
 * Sources: IAU 2015, CODATA 2018, NASA JPL Horizons, NASA SP-4029 (Saturn V).
 */

// Universal Gravitational Constant G in m³ / (kg · s²)
export const G_UNIVERSAL = 6.67430e-11;

// Standard Earth gravity at sea level (m/s²)
export const STANDARD_G0 = 9.80665;

// ==========================================
// EARTH (IAU / WGS-84 reference)
// ==========================================
export const EARTH_RADIUS_M = 6371000; // Mean volumetric radius in meters (6,371 km)
export const EARTH_MU = 3.986004418e14; // Standard gravitational parameter (m³/s²)
export const EARTH_MASS_KG = EARTH_MU / G_UNIVERSAL; // ~5.9722e24 kg
export const EARTH_ROTATION_PERIOD_S = 86164.0905; // Sidereal rotation day in seconds (~23h 56m 4.1s)
export const EARTH_ROTATION_RATE_RAD_PER_S = (2 * Math.PI) / EARTH_ROTATION_PERIOD_S; // ~7.292115e-5 rad/s
export const EARTH_SURFACE_ROTATION_SPEED_MPS = EARTH_ROTATION_RATE_RAD_PER_S * EARTH_RADIUS_M; // ~464.6 m/s at equator

// Earth Atmosphere (US Standard Atmosphere 1976 model approximation)
export const ATMOSPHERE_SEA_LEVEL_DENSITY_KG_M3 = 1.225; // kg/m³
export const ATMOSPHERE_SCALE_HEIGHT_M = 8500; // Effective barometric scale height in meters
export const ATMOSPHERE_TOP_ALTITUDE_M = 120000; // 120 km (sensible atmosphere limit)
export const ATMOSPHERE_KARMAN_LINE_M = 100000; // 100 km international space boundary

// ==========================================
// MOON (IAU / NASA Lunar Fact Sheet)
// ==========================================
export const MOON_RADIUS_M = 1737400; // Mean radius in meters (1,737.4 km)
export const MOON_MU = 4.9048695e12; // Standard gravitational parameter (m³/s²)
export const MOON_MASS_KG = MOON_MU / G_UNIVERSAL; // ~7.342e22 kg
export const MOON_SURFACE_GRAVITY = MOON_MU / (MOON_RADIUS_M * MOON_RADIUS_M); // ~1.625 m/s²
export const MOON_ORBITAL_DISTANCE_M = 384400000; // Semi-major axis around Earth (384,400 km)
export const MOON_ORBITAL_SPEED_MPS = Math.sqrt(EARTH_MU / MOON_ORBITAL_DISTANCE_M); // ~1,018 m/s
export const MOON_ORBITAL_PERIOD_S = 2 * Math.PI * Math.sqrt(Math.pow(MOON_ORBITAL_DISTANCE_M, 3) / EARTH_MU); // ~2,360,584 s (~27.32 days)
export const MOON_SOI_RADIUS_M = MOON_ORBITAL_DISTANCE_M * Math.pow(MOON_MU / EARTH_MU, 2 / 5); // ~66,180 km Sphere of Influence

// ==========================================
// SUN (IAU / NASA Solar Fact Sheet)
// ==========================================
export const SUN_RADIUS_M = 6.9634e8; // Radius in meters (~696,340 km)
export const SUN_MU = 1.32712440018e20; // Gravitational parameter (m³/s²)
export const SUN_MASS_KG = SUN_MU / G_UNIVERSAL; // ~1.9885e30 kg
export const SUN_EARTH_DISTANCE_M = 1.495978707e11; // 1 Astronomical Unit (149.6M km)
export const EARTH_SOLAR_ORBITAL_SPEED_MPS = Math.sqrt(SUN_MU / SUN_EARTH_DISTANCE_M); // ~29,780 m/s (~29.8 km/s)

// ==========================================
// SATURN V LAUNCH VEHICLE SPECIFICATIONS
// (Source: NASA SP-4029 / Saturn V Flight Manual)
// ==========================================
export const SATURN_V_TOTAL_HEIGHT_M = 110.6;
export const SATURN_V_MAX_DIAMETER_M = 10.1;
export const SATURN_V_AERODYNAMIC_DRAG_COEFFICIENT = 0.35; // Streamlined cylindrical rocket
export const SATURN_V_CROSS_SECTION_AREA_M2 = Math.PI * Math.pow(SATURN_V_MAX_DIAMETER_M / 2, 2); // ~80.12 m²

// Stage 1: S-IC (5x F-1 engines, RP-1 / LOX)
export const STAGE1_NAME = 'S-IC (First Stage)';
export const STAGE1_DRY_MASS_KG = 131000;
export const STAGE1_FUEL_MASS_KG = 2160000;
export const STAGE1_THRUST_VAC_N = 38700000; // 38.7 MN
export const STAGE1_THRUST_SL_N = 35100000; // 35.1 MN
export const STAGE1_ISP_VAC_S = 304;
export const STAGE1_ISP_SL_S = 263;
export const STAGE1_HEIGHT_M = 42.1;
export const STAGE1_DIAMETER_M = 10.1;

// Stage 2: S-II (5x J-2 engines, LH2 / LOX)
export const STAGE2_NAME = 'S-II (Second Stage)';
export const STAGE2_DRY_MASS_KG = 40000;
export const STAGE2_FUEL_MASS_KG = 450000;
export const STAGE2_THRUST_VAC_N = 5140000; // 5.14 MN
export const STAGE2_ISP_VAC_S = 421;
export const STAGE2_HEIGHT_M = 24.8;
export const STAGE2_DIAMETER_M = 10.1;

// Stage 3: S-IVB (1x J-2 engine, LH2 / LOX)
export const STAGE3_NAME = 'S-IVB (Third Stage)';
export const STAGE3_DRY_MASS_KG = 13500;
export const STAGE3_FUEL_MASS_KG = 106000;
export const STAGE3_THRUST_VAC_N = 1000000; // 1.0 MN
export const STAGE3_ISP_VAC_S = 421;
export const STAGE3_HEIGHT_M = 17.8;
export const STAGE3_DIAMETER_M = 6.6;

// Stage 4: Apollo Spacecraft (Command/Service Module CSM + Lunar Module LM)
export const STAGE4_NAME = 'Apollo CSM & LM (Lunar Complex)';
export const STAGE4_DRY_MASS_KG = 12000; // Combined dry mass
export const STAGE4_FUEL_MASS_KG = 18000; // Hypergolic propellant
export const STAGE4_THRUST_VAC_N = 91000; // SPS Service Propulsion System (91 kN)
export const STAGE4_ISP_VAC_S = 314;
export const STAGE4_HEIGHT_M = 15.9;
export const STAGE4_DIAMETER_M = 3.9;

// Total Initial Wet Mass at Pad 39A
export const SATURN_V_TOTAL_LAUNCH_MASS_KG =
  STAGE1_DRY_MASS_KG +
  STAGE1_FUEL_MASS_KG +
  STAGE2_DRY_MASS_KG +
  STAGE2_FUEL_MASS_KG +
  STAGE3_DRY_MASS_KG +
  STAGE3_FUEL_MASS_KG +
  STAGE4_DRY_MASS_KG +
  STAGE4_FUEL_MASS_KG; // ~2,930,500 kg (~2,930 metric tons)

// Kennedy Space Center Launch Site
export const KSC_PAD_LATITUDE_DEG = 28.5721; // Cape Canaveral / Pad 39A
export const KSC_PAD_SURFACE_VELOCITY_MPS =
  EARTH_SURFACE_ROTATION_SPEED_MPS * Math.cos((KSC_PAD_LATITUDE_DEG * Math.PI) / 180); // ~408.3 m/s Eastward
