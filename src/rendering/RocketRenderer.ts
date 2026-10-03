import { Spacecraft } from '../physics/Spacecraft';
import { Camera } from './Camera';
import type { DebrisObject } from '../physics/Staging';

/**
 * High-fidelity vector renderer for the Saturn V Apollo launch vehicle
 * faithfully reconstructed from NASA technical blueprints.
 */
export class RocketRenderer {
  /**
   * Renders the active multi-stage spacecraft and all separated stage debris.
   */
  static render(
    ctx: CanvasRenderingContext2D,
    sc: Spacecraft,
    camera: Camera,
    width: number,
    height: number,
    ambientPressurePa: number
  ): void {
    const screenPos = camera.worldToScreen(sc.position, width, height);

    // 1. Draw separated stage debris
    RocketRenderer.renderDebris(ctx, sc.debrisList, camera, width, height);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    // Screen rotation: Canvas Y is flipped, so canvas angle = -rotation
    const screenRot = -sc.rotation;
    ctx.rotate(screenRot);

    // Compute pixel scale of the rocket
    const rocketLengthM = sc.currentLengthM;
    const pixelLength = rocketLengthM * camera.zoom;

    // When zoomed far out, draw a visible flight reticle/chevron so vehicle orientation is never lost
    if (pixelLength < 18) {
      RocketRenderer.renderReticle(ctx, sc, pixelLength);
      ctx.restore();
      return;
    }

    // Scale context so 1 unit = 1 meter along the rocket
    ctx.scale(camera.zoom, camera.zoom);

    // Draw active stages from bottom (aft) to top (forward)
    // Rocket coordinate system:
    // Origin (0, 0) at center of mass
    // +X points forward toward the nose
    // +Y points starboard (right), -Y points port (left)

    const stageIdx = sc.activeStageIndex;

    // Draw Engine Exhaust Plume if firing
    if (sc.engineActive && sc.throttle > 0 && (sc.activeStage?.fuelMassKg ?? 0) > 0) {
      RocketRenderer.renderEnginePlume(ctx, stageIdx, sc.throttle, ambientPressurePa);
    }

    // Render individual attached stages based on active stage
    if (stageIdx === 0) {
      // Full Stack: Stage 1 (S-IC), Stage 2 (S-II), Stage 3 (S-IVB), Stage 4 (CSM/LM)
      RocketRenderer.drawStage1(ctx);
      RocketRenderer.drawStage2(ctx, 42.1);
      RocketRenderer.drawStage3(ctx, 42.1 + 24.8);
      RocketRenderer.drawStage4(ctx, 42.1 + 24.8 + 17.8, true);
    } else if (stageIdx === 1) {
      // Stage 2 (S-II), Stage 3 (S-IVB), Stage 4 (CSM/LM)
      RocketRenderer.drawStage2(ctx, 0);
      RocketRenderer.drawStage3(ctx, 24.8);
      RocketRenderer.drawStage4(ctx, 24.8 + 17.8, true);
    } else if (stageIdx === 2) {
      // Stage 3 (S-IVB), Stage 4 (CSM/LM)
      RocketRenderer.drawStage3(ctx, 0);
      RocketRenderer.drawStage4(ctx, 17.8, false);
    } else {
      // Apollo CSM + LM only
      RocketRenderer.drawStage4(ctx, 0, false);
    }

    ctx.restore();
  }

  /**
   * Stage 1: S-IC (Length 42.1m, Diameter 10.1m, 5x F-1 engines, 4 aerodynamic fins)
   */
  private static drawStage1(ctx: CanvasRenderingContext2D): void {
    const xBase = 0;
    const len = 42.1;
    const r = 5.05; // 10.1m diameter

    ctx.save();

    // 1. Aerodynamic stabilization fins (4 fins)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.25;

    // Upper fin
    ctx.beginPath();
    ctx.moveTo(xBase + 1.5, r);
    ctx.lineTo(xBase + 0.5, r + 4.2);
    ctx.lineTo(xBase + 9.5, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower fin
    ctx.beginPath();
    ctx.moveTo(xBase + 1.5, -r);
    ctx.lineTo(xBase + 0.5, -r - 4.2);
    ctx.lineTo(xBase + 9.5, -r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. F-1 Engine Nozzle Bells (5 engines, 3 visible in side elevation)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.2;

    const engineOffsets = [-3.2, 0, 3.2];
    for (const yOff of engineOffsets) {
      ctx.beginPath();
      ctx.moveTo(xBase, yOff - 1.1);
      ctx.lineTo(xBase - 3.8, yOff - 1.85);
      ctx.lineTo(xBase - 3.8, yOff + 1.85);
      ctx.lineTo(xBase, yOff + 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nozzle fluting bands
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(xBase - 2.0, yOff - 1.45);
      ctx.lineTo(xBase - 2.0, yOff + 1.45);
      ctx.stroke();
    }

    // 3. S-IC Cylindrical Tank Body
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(xBase, -r, len, r * 2);

    // Roll pattern: Iconic vertical black quadrants for tracking cameras
    ctx.fillStyle = '#0f172a';
    // Mid section black bands
    ctx.fillRect(xBase + 10.5, -r, 14.5, r * 0.95);
    ctx.fillRect(xBase + 28.5, -r, 8.5, r * 2);

    // Panel line details
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.15;
    ctx.strokeRect(xBase, -r, len, r * 2);

    // Retro-rocket fairings on fins
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(xBase + 3.0, r - 0.4, 6.0, 0.8);
    ctx.fillRect(xBase + 3.0, -r - 0.4, 6.0, 0.8);

    ctx.restore();
  }

  /**
   * Stage 2: S-II (Length 24.8m, Diameter 10.1m, 5x J-2 engines)
   */
  private static drawStage2(ctx: CanvasRenderingContext2D, xBase: number): void {
    const len = 24.8;
    const r = 5.05;

    ctx.save();

    // S-II Interstage ring (open corrugated truss section)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(xBase, -r, 5.5, r * 2);

    // S-II Main LOX/LH2 Tank Body (White with corrugated vertical insulation)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(xBase + 5.5, -r, len - 5.5, r * 2);

    // Upper roll tracking black band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(xBase + len - 3.2, -r, 2.5, r * 2);

    // Panel border
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.15;
    ctx.strokeRect(xBase, -r, len, r * 2);

    // Vertical corrugation lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 0.1;
    for (let x = xBase + 6.0; x < xBase + len - 3.5; x += 1.8) {
      ctx.beginPath();
      ctx.moveTo(x, -r);
      ctx.lineTo(x, r);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Stage 3: S-IVB (Length 17.8m, Conical taper from 10.1m to 6.6m, 1x J-2 engine)
   */
  private static drawStage3(ctx: CanvasRenderingContext2D, xBase: number): void {
    const len = 17.8;
    const rBase = 5.05;
    const rMain = 3.3; // 6.6m diameter

    ctx.save();

    // Conical interstage adapter (10.1m -> 6.6m)
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(xBase, -rBase);
    ctx.lineTo(xBase + 5.2, -rMain);
    ctx.lineTo(xBase + 5.2, rMain);
    ctx.lineTo(xBase, rBase);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.15;
    ctx.stroke();

    // Main S-IVB cylinder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(xBase + 5.2, -rMain, len - 5.2, rMain * 2);
    ctx.strokeRect(xBase + 5.2, -rMain, len - 5.2, rMain * 2);

    // Forward black tracking mark
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(xBase + len - 2.5, -rMain, 1.8, rMain * 2);

    // Instrument Unit (IU) ring (0.9m)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(xBase + len - 0.9, -rMain, 0.9, rMain * 2);

    ctx.restore();
  }

  /**
   * Stage 4: Apollo Spacecraft (SLA conical adapter, Service Module, Command Module, Launch Escape Tower)
   */
  private static drawStage4(
    ctx: CanvasRenderingContext2D,
    xBase: number,
    includeEscapeTower: boolean
  ): void {
    const rBase = 3.3;
    const rCsm = 1.95; // 3.9m diameter

    ctx.save();

    // 1. Spacecraft Lunar Module Adapter (SLA) (8.5m cone from 6.6m to 3.9m)
    const slaLen = 8.5;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(xBase, -rBase);
    ctx.lineTo(xBase + slaLen, -rCsm);
    ctx.lineTo(xBase + slaLen, rCsm);
    ctx.lineTo(xBase, rBase);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.15;
    ctx.stroke();

    // Fairing petal division lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.beginPath();
    ctx.moveTo(xBase, 0);
    ctx.lineTo(xBase + slaLen, 0);
    ctx.stroke();

    // 2. Apollo Service Module (SM) (Length 7.5m, Diameter 3.9m)
    const smBase = xBase + slaLen;
    const smLen = 7.5;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(smBase, -rCsm, smLen, rCsm * 2);
    ctx.strokeRect(smBase, -rCsm, smLen, rCsm * 2);

    // Radiator thermal panels
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(smBase + 1.2, -rCsm * 0.85, smLen - 2.4, rCsm * 1.7);

    // 3. Apollo Command Module (CM) Capsule (Length 3.2m, Cone from 3.9m to 0.8m)
    const cmBase = smBase + smLen;
    const cmLen = 3.2;
    const rApex = 0.45;

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(cmBase, -rCsm);
    ctx.lineTo(cmBase + cmLen, -rApex);
    ctx.lineTo(cmBase + cmLen, rApex);
    ctx.lineTo(cmBase, rCsm);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.15;
    ctx.stroke();

    // Cockpit / Crew windows
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cmBase + cmLen * 0.45, 0, 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 4. Launch Escape System (LES) Tower (Length 9.7m) - jettisoned during early ascent
    if (includeEscapeTower) {
      const lesBase = cmBase + cmLen;
      // Open lattice truss
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.18;

      ctx.beginPath();
      ctx.moveTo(lesBase, -rApex);
      ctx.lineTo(lesBase + 4.5, -0.3);
      ctx.moveTo(lesBase, rApex);
      ctx.lineTo(lesBase + 4.5, 0.3);
      ctx.stroke();

      // Lattice cross braces
      for (let x = lesBase + 0.9; x < lesBase + 4.5; x += 0.9) {
        ctx.beginPath();
        ctx.moveTo(x, -0.4);
        ctx.lineTo(x + 0.45, 0.4);
        ctx.moveTo(x, 0.4);
        ctx.lineTo(x + 0.45, -0.4);
        ctx.stroke();
      }

      // Escape Rocket Solid Motor & Aerodynamic Nose Cone
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(lesBase + 4.5, -0.35, 4.2, 0.7);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(lesBase + 8.7, -0.35);
      ctx.lineTo(lesBase + 9.7, 0);
      ctx.lineTo(lesBase + 8.7, 0.35);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Renders the authentic rocket exhaust flame and plume.
   */
  private static renderEnginePlume(
    ctx: CanvasRenderingContext2D,
    stageIdx: number,
    throttle: number,
    ambientPressurePa: number
  ): void {
    ctx.save();

    // Plume expands dramatically in vacuum (underexpanded nozzle)
    const vacFactor = Math.max(1.0, 3.2 - (ambientPressurePa / 101325) * 2.2);

    if (stageIdx === 0) {
      // S-IC 5x F-1 Kerosene/LOX Flame: Massive fiery golden-orange plume with shock diamonds
      const plumeLength = (35 + Math.random() * 8) * throttle;
      const plumeWidth = 9.5 * vacFactor;

      const grad = ctx.createLinearGradient(0, 0, -plumeLength, 0);
      grad.addColorStop(0, '#ffffff'); // White-hot nozzle throat
      grad.addColorStop(0.2, '#fef08a'); // Brilliant yellow
      grad.addColorStop(0.55, '#f97316'); // Vibrant flame orange
      grad.addColorStop(0.85, 'rgba(239, 68, 68, 0.4)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-1.0, -plumeWidth * 0.4);
      ctx.lineTo(-plumeLength * 0.4, -plumeWidth * 0.7);
      ctx.lineTo(-plumeLength, 0);
      ctx.lineTo(-plumeLength * 0.4, plumeWidth * 0.7);
      ctx.lineTo(-1.0, plumeWidth * 0.4);
      ctx.closePath();
      ctx.fill();

      // Shock diamonds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let d = 5; d < Math.min(plumeLength * 0.65, 25); d += 6) {
        ctx.beginPath();
        ctx.moveTo(-d - 1.5, 0);
        ctx.lineTo(-d, -1.2);
        ctx.lineTo(-d + 1.5, 0);
        ctx.lineTo(-d, 1.2);
        ctx.closePath();
        ctx.fill();
      }
    } else if (stageIdx === 1 || stageIdx === 2) {
      // S-II / S-IVB Hydrolox (LH2/LOX) Plume: Faint ethereal blue/cyan vacuum plume
      const plumeLength = (22 + Math.random() * 5) * throttle;
      const plumeWidth = 8.0 * vacFactor;

      const grad = ctx.createLinearGradient(0, 0, -plumeLength, 0);
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.75)');
      grad.addColorStop(0.7, 'rgba(99, 102, 241, 0.35)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-0.5, -plumeWidth * 0.3);
      ctx.lineTo(-plumeLength * 0.45, -plumeWidth * 0.6);
      ctx.lineTo(-plumeLength, 0);
      ctx.lineTo(-plumeLength * 0.45, plumeWidth * 0.6);
      ctx.lineTo(-0.5, plumeWidth * 0.3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Apollo SPS Engine: Compact hypergolic plume
      const plumeLength = 12 * throttle;
      const plumeWidth = 3.5;

      const grad = ctx.createLinearGradient(0, 0, -plumeLength, 0);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#f59e0b');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -plumeWidth * 0.4);
      ctx.lineTo(-plumeLength, 0);
      ctx.lineTo(0, plumeWidth * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Renders separated stage debris falling in the world.
   */
  private static renderDebris(
    ctx: CanvasRenderingContext2D,
    debrisList: DebrisObject[],
    camera: Camera,
    width: number,
    height: number
  ): void {
    ctx.save();
    for (const d of debrisList) {
      const sPos = camera.worldToScreen(d.position, width, height);

      ctx.save();
      ctx.translate(sPos.x, sPos.y);
      ctx.rotate(-d.rotation);
      ctx.scale(camera.zoom, camera.zoom);

      // Render spent stage cylinder
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.2;
      ctx.fillRect(-d.height / 2, -d.width / 2, d.height, d.width);
      ctx.strokeRect(-d.height / 2, -d.width / 2, d.height, d.width);

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Renders high-visibility reticle when zoomed far out.
   */
  private static renderReticle(
    ctx: CanvasRenderingContext2D,
    sc: Spacecraft,
    _pixelLength: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Chevron pointing in direction of travel
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.stroke();

    // Engine thrust marker
    if (sc.engineActive && sc.throttle > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
