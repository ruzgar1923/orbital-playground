import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { Vector2 } from '../../physics/Vector2';
import { Starfield } from './Starfield';
import { ParticleSystem } from './ParticleSystem';
import { SimulationRenderer } from './SimulationRenderer';

export type CameraTarget = 'spacecraft' | 'earth' | 'moon' | 'sun' | 'free';

interface SimulationCanvasProps {
  engine: PhysicsEngine;
  cameraTarget: CameraTarget;
  onCameraTargetChange: (target: CameraTarget) => void;
  onTelemetryUpdate?: () => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  engine,
  cameraTarget,
  onCameraTargetChange,
  onTelemetryUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state
  const cameraRef = useRef<{
    pos: Vector2;
    zoom: number; // pixels per km
    isDragging: boolean;
    dragStart: { x: number; y: number };
    dragCameraStart: Vector2;
  }>({
    pos: new Vector2(150000, 1250), // Start near Earth LEO
    zoom: 0.22, // Good default zoom for LEO
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragCameraStart: Vector2.zero(),
  });

  const starfieldRef = useRef<Starfield>(new Starfield(400));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Keys currently held down
  const keysDownRef = useRef<Set<string>>(new Set());
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Convert World (km) to Screen (px)
  const worldToScreen = useCallback((worldPos: Vector2, width: number, height: number) => {
    const cam = cameraRef.current;
    return {
      x: width / 2 + (worldPos.x - cam.pos.x) * cam.zoom,
      y: height / 2 - (worldPos.y - cam.pos.y) * cam.zoom, // Canvas Y is inverted
    };
  }, []);

  // Convert Screen (px) to World (km)
  const screenToWorld = useCallback((screenX: number, screenY: number, width: number, height: number) => {
    const cam = cameraRef.current;
    return new Vector2(
      cam.pos.x + (screenX - width / 2) / cam.zoom,
      cam.pos.y - (screenY - height / 2) / cam.zoom
    );
  }, []);

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      setCanvasDimensions({ width: rect.width, height: rect.height });
      starfieldRef.current.resize(rect.width, rect.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Center camera on target when target changes or following
  useEffect(() => {
    if (cameraTarget === 'spacecraft') {
      cameraRef.current.pos = engine.spacecraft.position.clone();
    } else if (cameraTarget === 'earth') {
      cameraRef.current.pos = engine.earth.position.clone();
    } else if (cameraTarget === 'moon') {
      cameraRef.current.pos = engine.moon.position.clone();
    } else if (cameraTarget === 'sun') {
      cameraRef.current.pos = engine.sun.position.clone();
    }
  }, [cameraTarget, engine]);

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      keysDownRef.current.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        engine.spacecraft.toggleEngine();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        engine.initSystem();
        particleSystemRef.current.clear();
        cameraRef.current.pos = engine.spacecraft.position.clone();
        cameraRef.current.zoom = 0.22;
        onCameraTargetChange('spacecraft');
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        engine.spacecraft.setThrottle(0);
        engine.spacecraft.engineActive = false;
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        engine.spacecraft.setThrottle(1.0);
        engine.spacecraft.engineActive = true;
      } else if (e.code === 'Digit1') {
        engine.timeWarp = 1;
      } else if (e.code === 'Digit2') {
        engine.timeWarp = 10;
      } else if (e.code === 'Digit3') {
        engine.timeWarp = 100;
      } else if (e.code === 'Digit4') {
        engine.timeWarp = 1000;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onCameraTargetChange]);

  // Main animation / simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let telemetryCounter = 0;
    lastTimeRef.current = performance.now();

    const render = (currentTimestamp: number) => {
      const dtMs = currentTimestamp - lastTimeRef.current;
      lastTimeRef.current = currentTimestamp;
      const dt = Math.min(dtMs / 1000, 0.1);

      // 1. Process continuous keyboard controls
      const keys = keysDownRef.current;
      const rotSpeed = 2.2 * dt;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) {
        engine.spacecraft.rotate(rotSpeed);
      }
      if (keys.has('KeyD') || keys.has('ArrowRight')) {
        engine.spacecraft.rotate(-rotSpeed);
      }

      const throttleSpeed = 0.5 * dt;
      if (keys.has('KeyW') || keys.has('ArrowUp')) {
        engine.spacecraft.setThrottle(engine.spacecraft.throttle + throttleSpeed);
        engine.spacecraft.engineActive = true;
      }
      if (keys.has('KeyS') || keys.has('ArrowDown')) {
        engine.spacecraft.setThrottle(engine.spacecraft.throttle - throttleSpeed);
      }

      // 2. Step Physics Engine
      engine.update(dt);

      // Update particles
      if (engine.spacecraft.engineActive && engine.spacecraft.currentThrustForce > 0) {
        const nozzleOffset = engine.spacecraft.headingVector.scale(
          -12 / Math.max(cameraRef.current.zoom, 0.05)
        );
        const nozzleWorld = engine.spacecraft.position.add(nozzleOffset);
        particleSystemRef.current.emitExhaust(
          nozzleWorld,
          engine.spacecraft.headingVector,
          engine.spacecraft.velocity,
          engine.spacecraft.throttle,
          Math.ceil(engine.timeWarp > 10 ? 1 : 3)
        );
      }
      particleSystemRef.current.update(
        dt * (engine.timeWarp > 1 ? Math.min(engine.timeWarp, 10) : 1)
      );

      // 3. Update Camera Position if following a body
      if (cameraTarget === 'spacecraft') {
        cameraRef.current.pos = engine.spacecraft.position.clone();
      } else if (cameraTarget === 'earth') {
        cameraRef.current.pos = engine.earth.position.clone();
      } else if (cameraTarget === 'moon') {
        cameraRef.current.pos = engine.moon.position.clone();
      } else if (cameraTarget === 'sun') {
        cameraRef.current.pos = engine.sun.position.clone();
      }

      // 4. Render to Canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        ctx.save();
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        // Starfield
        starfieldRef.current.render(
          ctx,
          cameraRef.current.pos.x,
          cameraRef.current.pos.y,
          engine.time
        );

        const toScreen = (wPos: Vector2) => worldToScreen(wPos, width, height);

        // Celestial Orbits
        SimulationRenderer.drawReferenceOrbits(ctx, engine, cameraRef.current, toScreen);

        // Celestial Bodies (Sun, Earth, Moon)
        SimulationRenderer.drawCelestialBodies(
          ctx,
          engine,
          cameraRef.current,
          toScreen,
          width,
          height
        );

        // Spacecraft Trajectory Trail
        SimulationRenderer.drawTrajectoryTrail(ctx, engine, toScreen);

        // Projected Osculating Orbit Conic Curve
        SimulationRenderer.drawOsculatingOrbit(ctx, engine, toScreen);

        // Exhaust Particles
        particleSystemRef.current.render(ctx, toScreen);

        // Spacecraft
        SimulationRenderer.drawSpacecraft(
          ctx,
          engine.spacecraft,
          cameraRef.current,
          toScreen
        );

        // Screen banners
        if (engine.isPaused) {
          SimulationRenderer.drawPausedBanner(ctx, width);
        } else if (engine.isCrashed) {
          SimulationRenderer.drawCrashedBanner(ctx, engine.crashedBodyName, width);
        }

        ctx.restore();
      }

      // Update telemetry callback periodically
      telemetryCounter++;
      if (telemetryCounter % 3 === 0 && onTelemetryUpdate) {
        onTelemetryUpdate();
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [engine, cameraTarget, onCameraTargetChange, onTelemetryUpdate, worldToScreen]);

  // Mouse wheel: Zoom in / Zoom out centered on mouse cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cam = cameraRef.current;
    const worldBefore = screenToWorld(mouseX, mouseY, canvasDimensions.width, canvasDimensions.height);

    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    const newZoom = Math.max(0.0001, Math.min(10.0, cam.zoom * factor));
    cam.zoom = newZoom;

    if (cameraTarget === 'free') {
      const worldAfter = screenToWorld(mouseX, mouseY, canvasDimensions.width, canvasDimensions.height);
      const diff = worldBefore.sub(worldAfter);
      cam.pos = cam.pos.add(diff);
    }
  };

  // Mouse drag: Pan camera
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      cameraRef.current.isDragging = true;
      cameraRef.current.dragStart = { x: e.clientX, y: e.clientY };
      cameraRef.current.dragCameraStart = cameraRef.current.pos.clone();
      if (cameraTarget !== 'free') {
        onCameraTargetChange('free');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current.isDragging) return;

    const cam = cameraRef.current;
    const dx = e.clientX - cam.dragStart.x;
    const dy = e.clientY - cam.dragStart.y;

    cam.pos = new Vector2(
      cam.dragCameraStart.x - dx / cam.zoom,
      cam.dragCameraStart.y + dy / cam.zoom
    );
  };

  const handleMouseUp = () => {
    cameraRef.current.isDragging = false;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
