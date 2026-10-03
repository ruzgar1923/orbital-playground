/**
 * Physical and simulation constants for Orbital Playground.
 *
 * SIMULATION SCALE SYSTEM:
 * - Distance Unit: 1 unit = 1 kilometer (km) = 1,000 meters.
 * - Time Unit: 1 unit = 1 second (s).
 * - Velocity Unit: km/s (1 km/s = 1,000 m/s).
 * - Acceleration Unit: km/s² (1 km/s² = 1,000 m/s² ≈ 101.97 G).
 * - Mass Unit: kilograms (kg).
 * - Force / Thrust Unit: Kilonewtons (kN) or Newtons (N).
 *   In simulation units: a_thrust (km/s²) = Thrust (kN) / Mass (kg).
 *   Since 1 kN = 1,000 N = 1,000 kg·m/s² = 1 kg·km/s²,
 *   a = Thrust(kN) / Mass(kg) directly yields km/s²!
 *
 * SCALING DOCUMENTATION:
 * Real astronomical scale makes the Earth-Moon-Sun system impossible to view
 * concurrently on a screen without logarithmic distortion or sub-pixel bodies.
 * Orbital Playground uses an educational "minified planetary system" (similar to KSP):
 * - Earth Radius: 1,000 km (Earth surface gravity g₀ = 9.81 m/s² = 0.00981 km/s²).
 * - Earth Gravitational Parameter: μ_E = g₀ * R_E² = 9,810 km³/s².
 * - Moon: Distance = 10,000 km (~10 Earth radii), Radius = 270 km (~0.27 R_E),
 *   μ_M = 120.6 km³/s² (Moon surface gravity g_M ≈ 1.65 m/s²).
 * - Sun: Distance = 150,000 km (~15 Earth-Moon distances), Radius = 7,000 km,
 *   μ_S = 2,943,000 km³/s² (Earth completes orbit stably with Hill sphere ≈ 15,530 km,
 *   safely enclosing the Moon's 10,000 km orbit without tidal disruption).
 *
 * Low Earth Orbit (LEO):
 * - Altitude: 250 km (Radius: 1,250 km from Earth center).
 * - Circular Orbital Velocity: v = √(μ_E / r) = √(9810 / 1250) ≈ 2.8014 km/s (2,801.4 m/s).
 * - Orbital Period: T = 2π √(r³ / μ_E) ≈ 2,804 s ≈ 46.7 minutes.
 */

// Universal Gravitational Constant in km³ / (kg · s²)
// (SI value 6.67430e-11 m³/(kg·s²) converted: 1 m³ = 1e-9 km³ => 6.67430e-20 km³/(kg·s²))
export const G_UNIVERSAL = 6.6743e-20;

// Earth properties
export const EARTH_RADIUS_KM = 1000; // km
export const EARTH_MU = 9810; // km³/s² (G * M_Earth)
export const EARTH_MASS_KG = EARTH_MU / G_UNIVERSAL; // ~1.47e23 kg
export const EARTH_COLOR = '#38bdf8';
export const EARTH_ATMOSPHERE_COLOR = 'rgba(56, 189, 248, 0.25)';

// Moon properties
export const MOON_DISTANCE_KM = 10000; // km
export const MOON_RADIUS_KM = 270; // km
export const MOON_MU = 120.6; // km³/s²
export const MOON_MASS_KG = MOON_MU / G_UNIVERSAL;
export const MOON_COLOR = '#cbd5e1';

// Sun properties
export const SUN_DISTANCE_KM = 150000; // km
export const SUN_RADIUS_KM = 7000; // km
export const SUN_MU = 2943000; // km³/s²
export const SUN_MASS_KG = SUN_MU / G_UNIVERSAL;
export const SUN_COLOR = '#facc15';
export const SUN_GLOW_COLOR = 'rgba(250, 204, 21, 0.35)';

// Spacecraft standard specs
export const SPACECRAFT_DRY_MASS_KG = 1000; // kg
export const SPACECRAFT_INITIAL_FUEL_KG = 500; // kg
export const SPACECRAFT_MAX_THRUST_KN = 18.0; // kN (18,000 N)
export const SPACECRAFT_ISP_S = 310; // Specific Impulse in seconds
export const STANDARD_G0 = 0.00981; // km/s² (9.81 m/s²)
// Fuel mass flow rate at 100% throttle: m_dot = F / (I_sp * g₀)
export const SPACECRAFT_MAX_FUEL_BURN_RATE_KG_PER_S =
  SPACECRAFT_MAX_THRUST_KN / (SPACECRAFT_ISP_S * STANDARD_G0); // ~5.92 kg/s

// Rotation speed: radians per second (manual reaction control)
export const SPACECRAFT_ROTATION_SPEED_RAD_PER_S = Math.PI * 0.8; // ~144 deg/sec
