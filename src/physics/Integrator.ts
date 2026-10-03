import { Vector2 } from './Vector2';

export type AccelerationFunction = (position: Vector2, velocity: Vector2, time: number) => Vector2;

export interface IntegrationState {
  position: Vector2;
  velocity: Vector2;
  acceleration?: Vector2;
}

export interface Integrator {
  readonly name: string;
  step(
    state: IntegrationState,
    dt: number,
    time: number,
    calcAcceleration: AccelerationFunction
  ): { position: Vector2; velocity: Vector2; acceleration: Vector2 };
}

/**
 * Semi-Implicit Euler (Symplectic Euler) Integrator:
 * v_{n+1} = v_n + a(r_n) * dt
 * r_{n+1} = r_n + v_{n+1} * dt
 * First-order symplectic, much better energy stability than standard forward Euler.
 */
export class SemiImplicitEulerIntegrator implements Integrator {
  readonly name = 'Semi-Implicit Euler';

  step(
    state: IntegrationState,
    dt: number,
    time: number,
    calcAcceleration: AccelerationFunction
  ): { position: Vector2; velocity: Vector2; acceleration: Vector2 } {
    const accel = calcAcceleration(state.position, state.velocity, time);
    const newVel = state.velocity.add(accel.scale(dt));
    const newPos = state.position.add(newVel.scale(dt));
    return {
      position: newPos,
      velocity: newVel,
      acceleration: accel,
    };
  }
}

/**
 * Velocity Verlet Integrator:
 * r_{n+1} = r_n + v_n * dt + 0.5 * a_n * dt²
 * a_{n+1} = a(r_{n+1})
 * v_{n+1} = v_n + 0.5 * (a_n + a_{n+1}) * dt
 * Second-order symplectic integrator. Excellent long-term energy conservation
 * for planetary orbits and spacecraft trajectories.
 */
export class VelocityVerletIntegrator implements Integrator {
  readonly name = 'Velocity Verlet';

  step(
    state: IntegrationState,
    dt: number,
    time: number,
    calcAcceleration: AccelerationFunction
  ): { position: Vector2; velocity: Vector2; acceleration: Vector2 } {
    const aCurrent = state.acceleration ?? calcAcceleration(state.position, state.velocity, time);

    // r_{n+1} = r_n + v_n * dt + 0.5 * a_n * dt²
    const newPos = state.position
      .add(state.velocity.scale(dt))
      .add(aCurrent.scale(0.5 * dt * dt));

    // Next acceleration at new position
    // (predict velocity for velocity-dependent thrust if any)
    const predictedVel = state.velocity.add(aCurrent.scale(dt));
    const aNext = calcAcceleration(newPos, predictedVel, time + dt);

    // v_{n+1} = v_n + 0.5 * (a_n + a_{n+1}) * dt
    const newVel = state.velocity.add(aCurrent.add(aNext).scale(0.5 * dt));

    return {
      position: newPos,
      velocity: newVel,
      acceleration: aNext,
    };
  }
}

/**
 * 4th-Order Runge-Kutta (RK4) Integrator:
 * High-precision general-purpose numerical integrator.
 * Evaluates derivatives at 4 points across the interval dt.
 */
export class RK4Integrator implements Integrator {
  readonly name = 'Runge-Kutta 4 (RK4)';

  step(
    state: IntegrationState,
    dt: number,
    time: number,
    calcAcceleration: AccelerationFunction
  ): { position: Vector2; velocity: Vector2; acceleration: Vector2 } {
    const pos = state.position;
    const vel = state.velocity;

    // k1
    const k1_v = calcAcceleration(pos, vel, time);
    const k1_r = vel;

    // k2
    const pos_k2 = pos.add(k1_r.scale(0.5 * dt));
    const vel_k2 = vel.add(k1_v.scale(0.5 * dt));
    const k2_v = calcAcceleration(pos_k2, vel_k2, time + 0.5 * dt);
    const k2_r = vel_k2;

    // k3
    const pos_k3 = pos.add(k2_r.scale(0.5 * dt));
    const vel_k3 = vel.add(k2_v.scale(0.5 * dt));
    const k3_v = calcAcceleration(pos_k3, vel_k3, time + 0.5 * dt);
    const k3_r = vel_k3;

    // k4
    const pos_k4 = pos.add(k3_r.scale(dt));
    const vel_k4 = vel.add(k3_v.scale(dt));
    const k4_v = calcAcceleration(pos_k4, vel_k4, time + dt);
    const k4_r = vel_k4;

    // Weighted average
    const newPos = pos.add(
      k1_r.add(k2_r.scale(2)).add(k3_r.scale(2)).add(k4_r).scale(dt / 6)
    );
    const newVel = vel.add(
      k1_v.add(k2_v.scale(2)).add(k3_v.scale(2)).add(k4_v).scale(dt / 6)
    );
    const finalAccel = calcAcceleration(newPos, newVel, time + dt);

    return {
      position: newPos,
      velocity: newVel,
      acceleration: finalAccel,
    };
  }
}
