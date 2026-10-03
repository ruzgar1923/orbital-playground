import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { Spacecraft } from '../../physics/Spacecraft';
import { Vector2 } from '../../physics/Vector2';
import { getOsculatingOrbitPoints } from '../../physics/Orbit';
import { formatDistance } from '../../utils/formatters';

export interface CameraState {
  pos: Vector2;
  zoom: number;
}

export type WorldToScreenFn = (worldPos: Vector2) => { x: number; y: number };

export class SimulationRenderer {
  static drawReferenceOrbits(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    cam: CameraState,
    worldToScreen: WorldToScreenFn
  ): void {
    // Earth's orbit around Sun (150,000 km radius circle around Sun)
    const sunScreen = worldToScreen(engine.sun.position);
    const earthOrbitRadiusPx = 150000 * cam.zoom;

    if (earthOrbitRadiusPx > 5 && earthOrbitRadiusPx < 20000) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, earthOrbitRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Moon's orbit around Earth (10,000 km radius circle around Earth)
    const earthScreen = worldToScreen(engine.earth.position);
    const moonOrbitRadiusPx = 10000 * cam.zoom;

    if (moonOrbitRadiusPx > 5 && moonOrbitRadiusPx < 20000) {
      ctx.save();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(earthScreen.x, earthScreen.y, moonOrbitRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  static drawCelestialBodies(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    cam: CameraState,
    worldToScreen: WorldToScreenFn,
    width: number,
    height: number
  ): void {
    for (const body of engine.bodies) {
      const screenPos = worldToScreen(body.position);
      const radiusPx = Math.max(3, body.radius * cam.zoom);

      // Skip if off-screen by large margin
      if (
        screenPos.x < -radiusPx * 2 ||
        screenPos.x > width + radiusPx * 2 ||
        screenPos.y < -radiusPx * 2 ||
        screenPos.y > height + radiusPx * 2
      ) {
        continue;
      }

      ctx.save();

      // Atmospheric / Coronal Glow
      if (body.id === 'sun') {
        const glowRadius = Math.max(radiusPx * 2.2, radiusPx + 15);
        const glowGrad = ctx.createRadialGradient(
          screenPos.x,
          screenPos.y,
          radiusPx * 0.8,
          screenPos.x,
          screenPos.y,
          glowRadius
        );
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
        glowGrad.addColorStop(0.3, 'rgba(234, 179, 8, 0.45)');
        glowGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (body.atmosphereRadius && body.atmosphereColor) {
        const atmRadiusPx = body.atmosphereRadius * cam.zoom;
        const atmGrad = ctx.createRadialGradient(
          screenPos.x,
          screenPos.y,
          radiusPx,
          screenPos.x,
          screenPos.y,
          atmRadiusPx
        );
        atmGrad.addColorStop(0, body.atmosphereColor);
        atmGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = atmGrad;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, atmRadiusPx, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body Solid Core
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Stylized body shading (Day/Night terminator facing Sun)
      if (body.id !== 'sun') {
        const toSun = engine.sun.position.sub(body.position).normalize();
        const sunAngleScreen = Math.atan2(-toSun.y, toSun.x);

        ctx.save();
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radiusPx, 0, Math.PI * 2);
        ctx.clip();

        // Dark night-side hemisphere
        ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
        ctx.beginPath();
        ctx.arc(
          screenPos.x,
          screenPos.y,
          radiusPx,
          sunAngleScreen + Math.PI / 2,
          sunAngleScreen - Math.PI / 2
        );
        ctx.fill();
        ctx.restore();
      }

      // Name label when visible
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(body.name.toUpperCase(), screenPos.x, screenPos.y + radiusPx + 14);

      ctx.restore();
    }
  }

  static drawTrajectoryTrail(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    worldToScreen: WorldToScreenFn
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

      const s1 = worldToScreen(worldP1);
      const s2 = worldToScreen(worldP2);

      const progress = i / trail.length;
      ctx.strokeStyle = `rgba(56, 189, 248, ${progress * 0.6})`;

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  static drawOsculatingOrbit(
    ctx: CanvasRenderingContext2D,
    engine: PhysicsEngine,
    worldToScreen: WorldToScreenFn
  ): void {
    try {
      const elements = engine.getOrbitalElements();
      const points = getOsculatingOrbitPoints(elements, 160);

      if (points.length < 2) return;

      ctx.save();
      ctx.lineWidth = 1.5;

      if (elements.isHyperbolic) {
        ctx.strokeStyle = '#f59e0b'; // Amber for hyperbolic escape
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = '#34d399'; // Emerald green for stable closed orbit
        ctx.setLineDash([4, 3]);
      }

      ctx.beginPath();
      const startScreen = worldToScreen(points[0]);
      ctx.moveTo(startScreen.x, startScreen.y);

      for (let i = 1; i < points.length; i++) {
        const pt = worldToScreen(points[i]);
        ctx.lineTo(pt.x, pt.y);
      }
      if (!elements.isHyperbolic) {
        ctx.closePath();
      }
      ctx.stroke();

      // Periapsis Marker (PE)
      const peScreen = worldToScreen(elements.periapsisPosition);
      SimulationRenderer.drawOrbitMarker(
        ctx,
        peScreen.x,
        peScreen.y,
        'PE',
        elements.periapsisAltitude,
        '#10b981'
      );

      // Apoapsis Marker (AP) - only if bound orbit
      if (elements.apoapsisPosition && elements.apoapsisAltitude !== null) {
        const apScreen = worldToScreen(elements.apoapsisPosition);
        SimulationRenderer.drawOrbitMarker(
          ctx,
          apScreen.x,
          apScreen.y,
          'AP',
          elements.apoapsisAltitude,
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

  static drawSpacecraft(
    ctx: CanvasRenderingContext2D,
    sc: Spacecraft,
    cam: CameraState,
    worldToScreen: WorldToScreenFn
  ): void {
    const screenPos = worldToScreen(sc.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const screenRot = -sc.rotation;
    ctx.rotate(screenRot);

    const shipSize = 14;

    // Heatshield / engine mount
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.rect(-shipSize * 0.6, -shipSize * 0.35, shipSize * 0.3, shipSize * 0.7);
    ctx.fill();

    // Rocket fuselage
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shipSize * 0.8, 0); // Nose cone tip (+X)
    ctx.lineTo(-shipSize * 0.4, -shipSize * 0.45); // Top fin
    ctx.lineTo(-shipSize * 0.3, 0); // Inset
    ctx.lineTo(-shipSize * 0.4, shipSize * 0.45); // Bottom fin
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Command module window (cockpit)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(shipSize * 0.25, 0, shipSize * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Reticle when zoomed out
    if (cam.zoom < 0.08) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      const headingDir = sc.headingVector;
      const notchX = screenPos.x + headingDir.x * 12;
      const notchY = screenPos.y - headingDir.y * 12;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(notchX, notchY, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  static drawPausedBanner(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(width / 2 - 130, 24, 260, 36);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 130, 24, 260, 36);

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
    ctx.fillStyle = 'rgba(153, 27, 27, 0.85)';
    ctx.fillRect(width / 2 - 170, 24, 340, 42);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 170, 24, 340, 42);

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
