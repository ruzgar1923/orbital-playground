import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from '../PhysicsEngine';
import { Camera } from '../../rendering/Camera';
import { SCENARIOS } from '../../simulation/Scenario';
import { KSC_PAD_LATITUDE_DEG } from '../Constants';
import { Vector2 } from '../Vector2';

describe('Launchpad Stability and Mission Scenarios Regression Suite', () => {
  it('keeps spacecraft stable on Pad 39A surface when simulation starts without thrust', () => {
    const engine = new PhysicsEngine();
    expect(engine.spacecraft.isLanded).toBe(true);

    // Unpause simulation (User clicks START)
    engine.isPaused = false;

    // Simulate 60 frames (approx 1 second of wall time)
    for (let f = 0; f < 60; f++) {
      engine.update(0.016);
      const alt = engine.earth.getAltitude(engine.spacecraft.position);
      // Altitude must remain exactly ~1 meter above ground (surface locked)
      expect(alt).toBeCloseTo(1.0, 1);
      expect(engine.spacecraft.isLanded).toBe(true);
      expect(engine.isCrashed).toBe(false);
    }
  });

  it('keeps spacecraft exactly aligned with Pad 39A coordinates during planetary rotation', () => {
    const engine = new PhysicsEngine();
    const camera = new Camera(engine.spacecraft.position, 4.0);
    const width = 1280;
    const height = 800;

    engine.isPaused = false;
    for (let f = 0; f < 100; f++) {
      engine.update(0.016);
      camera.pos = engine.spacecraft.position.clone();
    }

    const scScreen = camera.worldToScreen(engine.spacecraft.position, width, height);

    const padAngle = (KSC_PAD_LATITUDE_DEG * Math.PI) / 180 + engine.earth.rotationAngle;
    const padWorld = engine.earth.position.add(
      new Vector2(Math.cos(padAngle), Math.sin(padAngle)).scale(engine.earth.radius)
    );
    const padScreen = camera.worldToScreen(padWorld, width, height);

    // Pad should be exactly 1 meter (4 pixels at 4 px/m) below spacecraft base
    const distPx = Math.hypot(padScreen.x - scScreen.x, padScreen.y - scScreen.y);
    expect(distPx).toBeCloseTo(4.0, 1);
  });

  it('executes liftoff when full throttle and ignition are engaged', () => {
    const engine = new PhysicsEngine();
    engine.fullThrottle();
    engine.isPaused = false;

    // Advance 0.2 seconds
    engine.update(0.2);

    expect(engine.spacecraft.isLanded).toBe(false);
    expect(engine.spacecraft.acceleration.mag()).toBeGreaterThan(0);
  });

  it('runs all 4 mission scenarios stably with finite coordinates', () => {
    for (let s = 0; s < SCENARIOS.length; s++) {
      const engine = new PhysicsEngine();
      engine.loadScenario(s);
      engine.isPaused = false;

      for (let f = 0; f < 30; f++) {
        engine.update(0.016);
      }

      expect(Number.isFinite(engine.spacecraft.position.x)).toBe(true);
      expect(Number.isFinite(engine.spacecraft.position.y)).toBe(true);
      expect(Number.isFinite(engine.spacecraft.velocity.x)).toBe(true);
      expect(Number.isFinite(engine.spacecraft.velocity.y)).toBe(true);
    }
  });
});
