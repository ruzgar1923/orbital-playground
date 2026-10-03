import { PhysicsEngine } from '../physics/PhysicsEngine';
import { Camera } from './Camera';
import { RocketRenderer } from './RocketRenderer';
import { PlanetRenderer } from './PlanetRenderer';
import { getOsculatingOrbitPoints } from '../physics/Orbit';
import { formatDistance } from '../utils/formatters';

export class SimulationRenderer {
  /**
   * Draws faint celestial orbit guide lines (Moon around Earth, Earth around Sun).
   */
  static drawReferenceOrbits(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    camera: Camera,
    width: number,
    height: number
  ): void {
    // Earth around Sun
    const sunScreen = camera.worldToScreen(engine.sun.position, width, height);
    const earthOrbitRadiusPx = 1.495978707e11 * camera.zoom;

    if (earthOrbitRadiusPx > 5 && earthOrbitRadiusPx < 30000) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, earthOrbitRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Moon around Earth
    const earthScreen = camera.worldToScreen(engine.earth.position, width, height);
    const moonOrbitRadiusPx = 384400000 * camera.zoom;

    if (moonOrbitRadiusPx > 5 && moonOrbitRadiusPx < 30000) {
      ctx.save();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(earthScreen.x, earthScreen.y, moonOrbitRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Draws past trajectory trail.
   */
  static drawTrajectoryTrail(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    camera: Camera,
    width: number,
    height: number
  ): void {
    const trail = engine.spacecraft.trajectoryTrail;
    if (trail.length < 2) return;

    const primary = engine.getDominantBody();

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);

    for (let i = 1; i < trail.length; i++) {
      const p1 = trail[i - 1];
      const p2 = trail[i];

      const worldP1 = primary.position.add(p1.relativeToBodyPosition);
      const worldP2 = primary.position.add(p2.relativeToBodyPosition);

      const s1 = camera.worldToScreen(worldP1, width, height);
      const s2 = camera.worldToScreen(worldP2, width, height);

      const progress = i / trail.length;
      ctx.strokeStyle = `rgba(56, 189, 248, ${progress * 0.6})`;

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draws projected osculating Keplerian conic orbit line with AP and PE markers.
   */
  static drawOsculatingOrbit(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    camera: Camera,
    width: number,
    height: number
  ): void {
    // Only draw orbit line when in flight (not locked on pad)
    if (engine.spacecraft.isLanded) return;

    try {
      const elements = engine.getOrbitalElements();
      const points = getOsculatingOrbitPoints(elements, 160);

      if (points.length < 2) return;

      ctx.save();
      ctx.lineWidth = 1.5;

      if (elements.isHyperbolic) {
        ctx.strokeStyle = '#f59e0b'; // Amber for hyperbolic escape
        ctx.setLineDash([6, 4]);
      } else if (elements.isSuborbital) {
        ctx.strokeStyle = '#f43f5e'; // Red for suborbital impact trajectory
        ctx.setLineDash([4, 3]);
      } else {
        ctx.strokeStyle = '#34d399'; // Emerald green for stable closed orbit
        ctx.setLineDash([4, 3]);
      }

      ctx.beginPath();
      const startScreen = camera.worldToScreen(points[0], width, height);
      ctx.moveTo(startScreen.x, startScreen.y);

      for (let i = 1; i < points.length; i++) {
        const pt = camera.worldToScreen(points[i], width, height);
        ctx.lineTo(pt.x, pt.y);
      }
      if (!elements.isHyperbolic) {
        ctx.closePath();
      }
      ctx.stroke();

      // Periapsis Marker (PE)
      const peScreen = camera.worldToScreen(elements.periapsisPosition, width, height);
      SimulationRenderer.drawOrbitMarker(
        ctx,
        peScreen.x,
        peScreen.y,
        'PE',
        elements.periapsisAltitude / 1000, // converted to km for display
        elements.isSuborbital ? '#f43f5e' : '#10b981'
      );

      // Apoapsis Marker (AP) - only if bound orbit
      if (elements.apoapsisPosition && elements.apoapsisAltitude !== null) {
        const apScreen = camera.worldToScreen(elements.apoapsisPosition, width, height);
        SimulationRenderer.drawOrbitMarker(
          ctx,
          apScreen.x,
          apScreen.y,
          'AP',
          elements.apoapsisAltitude / 1000,
          '#38bdf8'
        );
      }

      ctx.restore();
    } catch {
      // Numerical edge cases gracefully handled
    }
  }

  static drawOrbitMarker(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    altitudeKm: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 5, y);
    ctx.closePath();
    ctx.fill();

    ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    const text = `${label}: ${formatDistance(altitudeKm)}`;
    ctx.fillText(text, x + 8, y + 3);
    ctx.restore();
  }

  /**
   * Main simulation render pipeline.
   */
  static renderSimulation(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    camera: Camera,
    width: number,
    height: number
  ): void {
    // 1. Reference planetary orbits
    SimulationRenderer.drawReferenceOrbits(ctx, engine, camera, width, height);

    // 2. Celestial bodies with LOD (Sun, Earth, Moon)
    for (const body of engine.bodies) {
      PlanetRenderer.renderBody(ctx, body, engine.sun, camera, width, height);
    }

    // 3. Past trajectory trail
    SimulationRenderer.drawTrajectoryTrail(ctx, engine, camera, width, height);

    // 4. Projected osculating orbit line
    SimulationRenderer.drawOsculatingOrbit(ctx, engine, camera, width, height);

    // 5. Spacecraft & separated stage debris
    const primary = engine.getDominantBody();
    const altitude = primary.getAltitude(engine.spacecraft.position);
    const ambientPressure = primary.id === 'earth' && altitude < 120000 ? 101325 * Math.exp(-altitude / 8500) : 0;

    RocketRenderer.render(
      ctx,
      engine.spacecraft,
      camera,
      width,
      height,
      ambientPressure
    );
  }

  static drawPausedBanner(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(width / 2 - 140, 24, 280, 36);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 140, 24, 280, 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 12px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIMULATION PAUSED', width / 2, 46);
    ctx.restore();
  }

  static drawCrashedBanner(
    ctx: CanvasRenderingContext2D,
    crashedBodyName: string | null,
    width: number
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(153, 27, 27, 0.9)';
    ctx.fillRect(width / 2 - 180, 24, 360, 42);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 180, 24, 360, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `CRASH DETECTED: IMPACT WITH ${crashedBodyName?.toUpperCase() || 'SURFACE'}`,
      width / 2,
      50
    );
    ctx.restore();
  }
}
