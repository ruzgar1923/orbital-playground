import React, { useState, useCallback } from 'react';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { SimulationCanvas } from './components/simulation/SimulationCanvas';
import { type CameraTarget } from './rendering/Camera';
import { FlightComputer } from './components/panels/FlightComputer';
import { StageControl } from './components/panels/StageControl';
import { MissionPanel } from './components/panels/MissionPanel';
import { SimulationControls } from './components/panels/SimulationControls';
import { CameraControls } from './components/panels/CameraControls';
import { PhysicsGuideModal } from './components/panels/PhysicsGuideModal';
import { VehicleViewerModal } from './components/panels/VehicleViewerModal';
import { KeyboardHelp } from './components/panels/KeyboardHelp';
import { Orbit, Maximize, Minimize, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [engine] = useState(() => new PhysicsEngine());
  const [, setTick] = useState(0);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>('spacecraft');
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTelemetryUpdate = useCallback(() => {
    setTick((t) => (t + 1) % 10000);
  }, []);

  const handleReset = useCallback(() => {
    engine.initSystem(engine.activeScenarioIndex);
    setCameraTarget('spacecraft');
    setTick((t) => t + 1);
  }, [engine]);

  const handleScenarioSelect = useCallback(
    (index: number) => {
      engine.loadScenario(index);
      setCameraTarget('spacecraft');
      setTick((t) => t + 1);
    },
    [engine]
  );

  const handleZoomIn = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
  };

  const handleZoomOut = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
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
      {/* 1. Main Viewport Canvas */}
      <SimulationCanvas
        engine={engine}
        cameraTarget={cameraTarget}
        onCameraTargetChange={setCameraTarget}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* 2. Top Header Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/85 border border-slate-800 rounded-xl backdrop-blur-md shadow-lg">
            <Orbit className="w-5 h-5 text-sky-400" />
            <div>
              <h1 className="text-xs font-extrabold font-mono tracking-wider text-slate-100 flex items-center gap-2 m-0 leading-none">
                ORBITAL PLAYGROUND
                <span className="text-[9px] font-normal text-amber-400 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                  SATURN V &bull; SI SCALE
                </span>
              </h1>
              <p className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                Newtonian Spaceflight Simulator &bull; Earth &bull; Moon &bull; Sun
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHudVisible(!isHudVisible)}
            className="md:hidden p-2 bg-slate-900/85 border border-slate-800 text-slate-300 rounded-xl backdrop-blur-md"
            title="Toggle Flight Panels"
          >
            {isHudVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <VehicleViewerModal />
          <PhysicsGuideModal />
          <KeyboardHelp />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md transition active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3. Left Controls: Mission Panel & Flight Computer HUD */}
      {isHudVisible && (
        <aside className="absolute top-14 left-4 z-20 pointer-events-auto max-h-[calc(100vh-100px)] overflow-y-auto pr-1 flex flex-col gap-2.5">
          <MissionPanel engine={engine} onScenarioSelect={handleScenarioSelect} />
          <FlightComputer engine={engine} />
        </aside>
      )}

      {/* 4. Right Controls: Camera Targeting & Staging Sequence */}
      <aside className="absolute top-14 right-4 z-20 pointer-events-auto flex flex-col gap-2.5 items-end">
        <CameraControls
          cameraTarget={cameraTarget}
          onTargetChange={setCameraTarget}
          onResetView={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
        <StageControl engine={engine} onUpdate={() => setTick((t) => t + 1)} />
      </aside>

      {/* 5. Bottom Simulation Controls & Time Warp */}
      <footer className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[96vw]">
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
