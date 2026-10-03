import React, { useState, useCallback } from 'react';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { SimulationCanvas, type CameraTarget } from './components/simulation/SimulationCanvas';
import { FlightComputer } from './components/panels/FlightComputer';
import { SimulationControls } from './components/panels/SimulationControls';
import { CameraControls } from './components/panels/CameraControls';
import { PhysicsGuideModal } from './components/panels/PhysicsGuideModal';
import { KeyboardHelp } from './components/panels/KeyboardHelp';
import { Orbit, Maximize, Minimize, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export const App: React.FC = () => {
  // Single persistent PhysicsEngine instance
  const [engine] = useState(() => new PhysicsEngine());

  // React state for UI triggers
  const [, setTick] = useState(0);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>('spacecraft');
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Periodic telemetry refresh callback from simulation canvas
  const handleTelemetryUpdate = useCallback(() => {
    setTick((t) => (t + 1) % 10000);
  }, []);

  const handleReset = useCallback(() => {
    engine.initSystem();
    setCameraTarget('spacecraft');
    setTick((t) => t + 1);
  }, [engine]);

  const handleZoomIn = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
  };

  const handleZoomOut = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Main Interactive Canvas Viewport */}
      <SimulationCanvas
        engine={engine}
        cameraTarget={cameraTarget}
        onCameraTargetChange={setCameraTarget}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* 2. Top Header Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md shadow-lg">
            <Orbit className="w-5 h-5 text-sky-400 animate-spin-slow" />
            <div>
              <h1 className="text-sm font-extrabold font-mono tracking-wider text-slate-100 flex items-center gap-2 m-0 leading-none">
                ORBITAL PLAYGROUND
                <span className="text-[10px] font-normal text-sky-400 bg-sky-950/80 border border-sky-800/80 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5">
                Newtonian 2D Orbital Mechanics Simulator
              </p>
            </div>
          </div>

          {/* Toggle HUD button on mobile/tablets */}
          <button
            onClick={() => setIsHudVisible(!isHudVisible)}
            className="md:hidden p-2 bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl backdrop-blur-md"
            title="Toggle Flight Computer HUD"
          >
            {isHudVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <PhysicsGuideModal />
          <KeyboardHelp />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md transition active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3. Flight Computer HUD (Left Panel) */}
      {isHudVisible && (
        <aside className="absolute top-16 left-4 z-20 pointer-events-auto max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          <FlightComputer engine={engine} />
        </aside>
      )}

      {/* 4. Camera & Tracking Controls (Top Right) */}
      <aside className="absolute top-16 right-4 z-20 pointer-events-auto">
        <CameraControls
          cameraTarget={cameraTarget}
          onTargetChange={setCameraTarget}
          onResetView={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </aside>

      {/* 5. Simulation & Time Controls (Bottom Center) */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95vw]">
        <SimulationControls
          engine={engine}
          onReset={handleReset}
          onUpdate={() => setTick((t) => t + 1)}
        />
      </footer>
    </div>
  );
};

export default App;
