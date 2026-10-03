import { CelestialBody } from '../physics/CelestialBody';
import { Camera } from './Camera';
import { Vector2 } from '../physics/Vector2';
import { KSC_PAD_LATITUDE_DEG } from '../physics/Constants';

/**
 * Multi-scale Level of Detail (LOD) renderer for spherical Earth, Moon, and Sun.
 * Seamlessly transitions from full planetary globe to detailed low-altitude surface terrain.
 */
export class PlanetRenderer {
  /**
   * Main render dispatch for a celestial body.
   */
  static renderBody(
    ctx: CanvasRenderingContext2D,
    body: CelestialBody,
    sun: CelestialBody,
    camera: Camera,
    width: number,
    height: number
  ): void {
    const screenPos = camera.worldToScreen(body.position, width, height);
    const radiusPx = body.radius * camera.zoom;

    // Check if off-screen
    const maxBound = radiusPx * 1.5 + 50;
    if (
      screenPos.x < -maxBound ||
      screenPos.x > width + maxBound ||
      screenPos.y < -maxBound ||
      screenPos.y > height + maxBound
    ) {
      return;
    }

    if (body.id === 'sun') {
      PlanetRenderer.renderSun(ctx, screenPos, radiusPx);
      return;
    }

    // Level-of-Detail selection based on on-screen pixel size
    if (radiusPx < 20) {
      // LOD 0: Distant icon / dot
      PlanetRenderer.renderDistantBody(ctx, body, screenPos, radiusPx);
    } else if (radiusPx < 4000) {
      // LOD 1: Full spherical globe with continents, clouds, or lunar maria
      PlanetRenderer.renderOrbitalGlobe(ctx, body, sun, screenPos, radiusPx);
    } else {
      // LOD 2: Close-up low-altitude planetary horizon & surface terrain
      PlanetRenderer.renderSurfaceTerrain(ctx, body, sun, camera, screenPos, radiusPx, width, height);
    }
  }

  /**
   * Sun rendering: Glowing core, coronal rays, solar flare gradient.
   */
  private static renderSun(
    ctx: CanvasRenderingContext2D,
    screenPos: { x: number; y: number },
    radiusPx: number
  ): void {
    const displayRadius = Math.max(8, radiusPx);
    const glowRadius = Math.max(displayRadius * 2.5, displayRadius + 40);

    ctx.save();
    // Corona glow
    const grad = ctx.createRadialGradient(
      screenPos.x,
      screenPos.y,
      displayRadius * 0.7,
      screenPos.x,
      screenPos.y,
      glowRadius
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.35, 'rgba(250, 204, 21, 0.6)');
    grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.25)');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Solid core
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, displayRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * LOD 0: Far distant body badge.
   */
  private static renderDistantBody(
    ctx: CanvasRenderingContext2D,
    body: CelestialBody,
    screenPos: { x: number; y: number },
    radiusPx: number
  ): void {
    const drawRadius = Math.max(3, radiusPx);
    ctx.save();
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, drawRadius, 0, Math.PI * 2);
    ctx.fill();

    // Name label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(body.name.toUpperCase(), screenPos.x, screenPos.y + drawRadius + 12);
    ctx.restore();
  }

  /**
   * LOD 1: Spherical planetary globe with rotating continents, atmospheric haze, and day/night terminator.
   */
  private static renderOrbitalGlobe(
    ctx: CanvasRenderingContext2D,
    body: CelestialBody,
    sun: CelestialBody,
    screenPos: { x: number; y: number },
    radiusPx: number
  ): void {
    ctx.save();

    // Atmospheric outer haze ring (if Earth)
    if (body.hasAtmosphere && body.atmosphereRadius) {
      const atmoRadiusPx = radiusPx * 1.025;
      const atmoGrad = ctx.createRadialGradient(
        screenPos.x,
        screenPos.y,
        radiusPx * 0.98,
        screenPos.x,
        screenPos.y,
        atmoRadiusPx
      );
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmoGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)');
      atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, atmoRadiusPx, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clip to globe circle
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radiusPx, 0, Math.PI * 2);
    ctx.clip();

    if (body.id === 'earth') {
      // Ocean Base
      ctx.fillStyle = '#0369a1'; // Deep royal ocean blue
      ctx.fillRect(screenPos.x - radiusPx, screenPos.y - radiusPx, radiusPx * 2, radiusPx * 2);

      // Rotating Continents
      PlanetRenderer.drawEarthContinents(ctx, screenPos, radiusPx, body.rotationAngle);

      // Rotating Cloud Bands
      PlanetRenderer.drawEarthClouds(ctx, screenPos, radiusPx, body.rotationAngle * 1.15);
    } else {
      // Moon: Regolith Base
      ctx.fillStyle = '#94a3b8'; // Lunar gray
      ctx.fillRect(screenPos.x - radiusPx, screenPos.y - radiusPx, radiusPx * 2, radiusPx * 2);

      // Lunar Maria (dark basalt plains) and Craters
      PlanetRenderer.drawLunarMaria(ctx, screenPos, radiusPx, body.rotationAngle);
    }

    // Day/Night Terminator Shading
    const toSun = sun.position.sub(body.position).normalize();
    const sunAngle = Math.atan2(-toSun.y, toSun.x);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radiusPx, sunAngle + Math.PI / 2, sunAngle - Math.PI / 2);
    ctx.fill();

    ctx.restore();

    // Body Name Label
    if (radiusPx > 15) {
      ctx.save();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(body.name.toUpperCase(), screenPos.x, screenPos.y + radiusPx + 16);
      ctx.restore();
    }
  }

  /**
   * Earth Continents: Procedural continental shapes positioned relative to Earth rotation angle.
   */
  private static drawEarthContinents(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    r: number,
    rotAngle: number
  ): void {
    ctx.save();
    ctx.fillStyle = '#15803d'; // Lush continent green

    // 4 major landmass clusters wrapped spherically
    const landmasses = [
      { lon: 0.2, lat: 0.35, w: 0.65, h: 0.55 }, // North America / Florida
      { lon: 0.35, lat: -0.3, w: 0.45, h: 0.65 }, // South America
      { lon: 1.25, lat: 0.25, w: 0.85, h: 0.6 }, // Eurasia / Europe
      { lon: 1.35, lat: -0.2, w: 0.55, h: 0.75 }, // Africa
      { lon: 2.1, lat: -0.4, w: 0.4, h: 0.35 }, // Australia
    ];

    for (const land of landmasses) {
      const angle = land.lon * Math.PI * 2 + rotAngle;
      const xOffset = Math.sin(angle) * r * 0.9;
      const visible = Math.cos(angle);

      if (visible > -0.2) {
        const yOffset = land.lat * r * 0.85;
        const width = land.w * r * Math.max(0.2, visible);
        const height = land.h * r;

        ctx.beginPath();
        ctx.ellipse(
          center.x + xOffset,
          center.y - yOffset,
          Math.max(1, width / 2),
          Math.max(1, height / 2),
          0.1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Earth Clouds: Soft atmospheric cloud swirls rotating slightly faster than surface.
   */
  private static drawEarthClouds(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    r: number,
    cloudAngle: number
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + cloudAngle;
      const xOffset = Math.sin(angle) * r * 0.95;
      const visible = Math.cos(angle);

      if (visible > 0) {
        const yOffset = ((i % 3) - 1) * r * 0.45;
        ctx.beginPath();
        ctx.ellipse(
          center.x + xOffset,
          center.y - yOffset,
          r * 0.4 * visible,
          r * 0.12,
          -0.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Moon Maria: Dark basaltic lava plains (Sea of Tranquility, Ocean of Storms).
   */
  private static drawLunarMaria(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    r: number,
    rotAngle: number
  ): void {
    ctx.save();
    ctx.fillStyle = '#475569'; // Dark mare basalt

    const maria = [
      { angle: 0.1, dist: 0.35, size: 0.28 }, // Mare Tranquillitatis
      { angle: 0.4, dist: 0.45, size: 0.35 }, // Oceanus Procellarum
      { angle: -0.3, dist: 0.4, size: 0.25 }, // Mare Serenitatis
      { angle: -0.7, dist: 0.3, size: 0.22 }, // Mare Crisium
    ];

    for (const m of maria) {
      const a = m.angle + rotAngle;
      const x = center.x + Math.cos(a) * r * m.dist;
      const y = center.y + Math.sin(a) * r * m.dist;
      ctx.beginPath();
      ctx.arc(x, y, r * m.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rayed impact craters (Tycho & Copernicus)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(center.x + r * 0.15, center.y + r * 0.45, r * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * LOD 2: Surface terrain view when spacecraft is within close distance to Earth or Moon.
   * Renders curved planetary horizon, launch pad Pad 39A structures, and lunar craters.
   */
  private static renderSurfaceTerrain(
    ctx: CanvasRenderingContext2D,
    body: CelestialBody,
    _sun: CelestialBody,
    camera: Camera,
    screenPos: { x: number; y: number },
    radiusPx: number,
    width: number,
    height: number
  ): void {
    ctx.save();

    // 1. Draw large curved planetary surface
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radiusPx, 0, Math.PI * 2);

    if (body.id === 'earth') {
      ctx.fillStyle = '#065f46'; // Coastal grassy terrain
      ctx.fill();

      // Atmospheric blue sky gradient near horizon
      const skyGrad = ctx.createRadialGradient(
        screenPos.x,
        screenPos.y,
        radiusPx,
        screenPos.x,
        screenPos.y,
        radiusPx + 3000 * camera.zoom
      );
      skyGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      skyGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.save();
      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radiusPx + 3000 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Render Kennedy Space Center Launch Pad 39A
      PlanetRenderer.renderLaunchPad39A(ctx, body, camera, width, height);
    } else {
      // Moon surface: Cratered regolith horizon
      ctx.fillStyle = '#64748b';
      ctx.fill();

      PlanetRenderer.renderLunarSurfaceDetails(ctx, body, camera, width, height);
    }

    ctx.restore();
  }

  /**
   * Detailed Launch Complex 39A: Service gantry tower, launch mount, flame trench, and ground markings.
   */
  private static renderLaunchPad39A(
    ctx: CanvasRenderingContext2D,
    earth: CelestialBody,
    camera: Camera,
    width: number,
    height: number
  ): void {
    // Pad 39A location on Earth surface
    const padAngle = (KSC_PAD_LATITUDE_DEG * Math.PI) / 180;
    const padWorld = earth.position.add(
      new Vector2(Math.cos(padAngle), Math.sin(padAngle)).scale(earth.radius)
    );
    const padScreen = camera.worldToScreen(padWorld, width, height);

    ctx.save();
    ctx.translate(padScreen.x, padScreen.y);
    ctx.rotate(-padAngle + Math.PI / 2); // Align with local horizontal ground
    ctx.scale(camera.zoom, camera.zoom);

    // Only draw detailed geometry if zoom is large enough (> 0.2 px/m)
    if (camera.zoom > 0.15) {
      // Reinforced concrete launch mount base
      ctx.fillStyle = '#475569';
      ctx.fillRect(-22, -4, 44, 4);

      // Flame trench exhaust deflector
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -8, 24, 4);

      // Fixed Service Structure (FSS) Gantry Tower (Red/Orange lattice tower 110m tall)
      ctx.fillStyle = '#dc2626'; // NASA Apollo red tower
      ctx.fillRect(-25, 0, 7.5, 105);

      // Gantry cross-lattice framing
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.4;
      for (let y = 10; y < 100; y += 12) {
        ctx.beginPath();
        ctx.moveTo(-25, y);
        ctx.lineTo(-17.5, y + 12);
        ctx.moveTo(-25, y + 12);
        ctx.lineTo(-17.5, y);
        ctx.stroke();
      }

      // Crew access swing arm at 95m (white room)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-17.5, 96, 12, 3.5);

      // Lightning mast at top of tower
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-21.25, 105);
      ctx.lineTo(-21.25, 125);
      ctx.stroke();

      // Pad floodlights
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-24, 104, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Close-up Lunar Surface Details: Impact craters, rim shadows, boulders, and landing target.
   */
  private static renderLunarSurfaceDetails(
    ctx: CanvasRenderingContext2D,
    moon: CelestialBody,
    camera: Camera,
    width: number,
    height: number
  ): void {
    const landingSiteWorld = moon.position.add(new Vector2(0, moon.radius));
    const siteScreen = camera.worldToScreen(landingSiteWorld, width, height);

    ctx.save();
    ctx.translate(siteScreen.x, siteScreen.y);
    ctx.scale(camera.zoom, camera.zoom);

    if (camera.zoom > 0.1) {
      // Impact craters on the horizon
      const craters = [
        { x: -120, r: 45, depth: 8 },
        { x: 60, r: 30, depth: 6 },
        { x: 180, r: 65, depth: 12 },
        { x: -280, r: 80, depth: 15 },
      ];

      for (const c of craters) {
        // Shadowed interior
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(c.x, -c.depth * 0.4, c.r, c.depth, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sunlight rim highlight
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(c.x, 0, c.r, Math.PI * 0.8, Math.PI * 1.8);
        ctx.stroke();
      }

      // Landing target crosshair (Tranquility Base)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.moveTo(-25, 0);
      ctx.lineTo(25, 0);
      ctx.moveTo(0, -25);
      ctx.lineTo(0, 25);
      ctx.stroke();
    }

    ctx.restore();
  }
}
