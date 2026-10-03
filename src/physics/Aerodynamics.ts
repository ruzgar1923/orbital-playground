import { Vector2 } from './Vector2';
import { Atmosphere } from './Atmosphere';

export interface AerodynamicState {
  dragForce: Vector2; // in Newtons (N)
  dragMagnitude: number; // N
  dynamicPressure: number; // Pascals (Pa = N/m²)
  airDensity: number; // kg/m³
  machNumber: number;
}

/**
 * Aerodynamic drag and dynamic pressure calculations.
 */
export class Aerodynamics {
  /**
   * Computes aerodynamic drag vector on a body moving with velocity v_rel through air.
   * F_drag = 0.5 * rho * v_rel² * Cd * A * (-v_hat)
   */
  static computeDrag(
    altitudeMeters: number,
    velocityRelAir: Vector2,
    dragCoefficient: number,
    crossSectionAreaM2: number
  ): AerodynamicState {
    const density = Atmosphere.getDensity(altitudeMeters);
    const speed = velocityRelAir.mag();

    if (density <= 0 || speed <= 1e-3) {
      return {
        dragForce: Vector2.zero(),
        dragMagnitude: 0,
        dynamicPressure: 0,
        airDensity: density,
        machNumber: 0,
      };
    }

    // Dynamic pressure: q = 0.5 * rho * v²
    const dynamicPressure = 0.5 * density * speed * speed;

    // F_drag = q * Cd * A
    const dragMag = dynamicPressure * dragCoefficient * crossSectionAreaM2;

    // Drag opposes relative airflow direction: -v_rel / speed
    const dragDir = velocityRelAir.scale(-1 / speed);
    const dragForce = dragDir.scale(dragMag);

    const speedOfSound = Atmosphere.getSpeedOfSound(altitudeMeters);
    const machNumber = speed / Math.max(1, speedOfSound);

    return {
      dragForce,
      dragMagnitude: dragMag,
      dynamicPressure,
      airDensity: density,
      machNumber,
    };
  }
}
