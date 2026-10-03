import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { Camera, type CameraTarget } from '../../rendering/Camera';
import { Vector2 } from '../../physics/Vector2';
import { Starfield } from './Starfield';
import { SimulationRenderer } from '../../rendering/SimulationRenderer';

export type { CameraTarget };

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

  // Floating-origin camera starting zoomed in on Saturn V on the pad (~4 px/meter)
  const cameraRef = useRef<Camera>(new Camera(engine.spacecraft.position, 4.0));
  const starfieldRef = useRef<Starfield>(new Starfield(400));
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const keysDownRef = useRef<Set<string>>(new Set());
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Update canvas size on window resize
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

  // Update camera target tracking
  useEffect(() => {
    const cam = cameraRef.current;
    cam.target = cameraTarget;

    if (cameraTarget === 'spacecraft') {
      cam.pos = engine.spacecraft.position.clone();
    } else if (cameraTarget === 'earth') {
      cam.pos = engine.earth.position.clone();
    } else if (cameraTarget === 'moon') {
      cam.pos = engine.moon.position.clone();
    } else if (cameraTarget === 'sun') {
      cam.pos = engine.sun.position.clone();
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
        engine.initSystem(engine.activeScenarioIndex);
        cameraRef.current.pos = engine.spacecraft.position.clone();
        cameraRef.current.zoom = 4.0;
        onCameraTargetChange('spacecraft');
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        engine.cutThrottle();
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        engine.fullThrottle();
      } else if (e.code === 'Digit1') {
        engine.setTimeWarp(1);
      } else if (e.code === 'Digit2') {
        engine.setTimeWarp(10);
      } else if (e.code === 'Digit3') {
        engine.setTimeWarp(100);
      } else if (e.code === 'Digit4') {
        engine.setTimeWarp(1000);
      } else if (e.code === 'Digit5') {
        engine.setTimeWarp(10000);
      } else if (e.code === 'Digit6') {
        engine.setTimeWarp(100000);
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
      try {
        const dtMs = currentTimestamp - lastTimeRef.current;
        lastTimeRef.current = currentTimestamp;
        const dt = Math.min(dtMs / 1000, 0.1);

        // 1. Process continuous attitude and throttle keys
        const keys = keysDownRef.current;
        const rotSpeed = 1.2 * dt; // radians per second
        if (keys.has('KeyA') || keys.has('ArrowLeft')) {
          engine.spacecraft.rotate(rotSpeed);
        }
        if (keys.has('KeyD') || keys.has('ArrowRight')) {
          engine.spacecraft.rotate(-rotSpeed);
        }

        const throttleSpeed = 0.5 * dt;
        if (keys.has('KeyW') || keys.has('ArrowUp')) {
          engine.setThrottle(engine.spacecraft.throttle + throttleSpeed);
        }
        if (keys.has('KeyS') || keys.has('ArrowDown')) {
          engine.setThrottle(engine.spacecraft.throttle - throttleSpeed);
        }

        // 2. Step Physics Engine
        engine.update(dt);

        // 3. Update Camera Position if following a body
        const cam = cameraRef.current;
        if (cameraTarget === 'spacecraft') {
          cam.pos = engine.spacecraft.position.clone();
        } else if (cameraTarget === 'earth') {
          cam.pos = engine.earth.position.clone();
        } else if (cameraTarget === 'moon') {
          cam.pos = engine.moon.position.clone();
        } else if (cameraTarget === 'sun') {
          cam.pos = engine.sun.position.clone();
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

          // Deep space background
          ctx.fillStyle = '#030712';
          ctx.fillRect(0, 0, width, height);

          // Stars with parallax
          starfieldRef.current.render(ctx, cam.pos.x * 1e-4, cam.pos.y * 1e-4, engine.time);

          // Master simulation rendering
          SimulationRenderer.renderSimulation(ctx, engine, cam, width, height);

          // Diagnostics overlay (Dev HUD)
          SimulationRenderer.drawDiagnosticOverlay(ctx, engine, width, height);

          // Screen banners
          if (engine.isPaused) {
            SimulationRenderer.drawPausedBanner(ctx, width);
          } else if (engine.isCrashed) {
            SimulationRenderer.drawCrashedBanner(ctx, engine.crashedBodyName, width);
          }

          ctx.restore();
        }
      } catch (err) {
        console.error('Simulation render frame error caught:', err);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(16, 16, 400, 50);
          ctx.strokeStyle = '#fca5a5';
          ctx.strokeRect(16, 16, 400, 50);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('DIAGNOSTIC NOTICE: Render exception safely recovered', 24, 34);
          ctx.fillText(String(err).slice(0, 50), 24, 52);
          ctx.restore();
        }
      }

      // Update telemetry callback periodically (~20Hz)
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
  }, [engine, cameraTarget, onCameraTargetChange, onTelemetryUpdate]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.25 : 0.8;
      cameraRef.current.zoomAt(factor, mouseX, mouseY, canvasDimensions.width, canvasDimensions.height);
    },
    [canvasDimensions]
  );

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      const cam = cameraRef.current;
      cam.isDragging = true;
      cam.dragStart = { x: e.clientX, y: e.clientY };
      cam.dragCameraStart = cam.pos.clone();
      if (cameraTarget !== 'free') {
        onCameraTargetChange('free');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    if (!cam.isDragging) return;

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
