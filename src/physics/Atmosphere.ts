import {
  ATMOSPHERE_SEA_LEVEL_DENSITY_KG_M3,
  ATMOSPHERE_SCALE_HEIGHT_M,
  ATMOSPHERE_TOP_ALTITUDE_M,
} from './Constants';

/**
 * Atmospheric physics model based on the US Standard Atmosphere 1976 barometric approximation.
 */
export class Atmosphere {
  /**
   * Calculates atmospheric air density in kg/m³ at a given altitude in meters.
   * Returns 0 for altitudes above the sensible atmosphere (120 km).
   */
  static getDensity(altitudeMeters: number): number {
    if (altitudeMeters <= 0) {
      return ATMOSPHERE_SEA_LEVEL_DENSITY_KG_M3;
    }
    if (altitudeMeters >= ATMOSPHERE_TOP_ALTITUDE_M) {
      return 0;
    }
    // Barometric exponential decay: rho = rho_0 * exp(-h / H)
    return (
      ATMOSPHERE_SEA_LEVEL_DENSITY_KG_M3 *
      Math.exp(-altitudeMeters / ATMOSPHERE_SCALE_HEIGHT_M)
    );
  }

  /**
   * Calculates atmospheric pressure in Pascals at altitude h.
   * Sea level standard pressure = 101,325 Pa (1 atm).
   */
  static getPressure(altitudeMeters: number): number {
    if (altitudeMeters <= 0) return 101325;
    if (altitudeMeters >= ATMOSPHERE_TOP_ALTITUDE_M) return 0;
    return 101325 * Math.exp(-altitudeMeters / ATMOSPHERE_SCALE_HEIGHT_M);
  }

  /**
   * Approximate atmospheric temperature in Kelvin (Troposphere lapse rate up to 11km).
   */
  static getTemperature(altitudeMeters: number): number {
    const T0 = 288.15; // 15°C
    if (altitudeMeters < 11000) {
      return Math.max(216.65, T0 - 0.0065 * altitudeMeters);
    }
    if (altitudeMeters < 25000) {
      return 216.65; // Stratosphere isothermal zone
    }
    return Math.max(180, 216.65 + 0.001 * (altitudeMeters - 25000));
  }

  /**
   * Speed of sound in m/s: a = sqrt(gamma * R * T)
   */
  static getSpeedOfSound(altitudeMeters: number): number {
    const T = Atmosphere.getTemperature(altitudeMeters);
    return Math.sqrt(1.4 * 287.05 * T);
  }
}
