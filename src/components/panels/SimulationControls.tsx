import React from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { formatTime } from '../../utils/formatters';
import { Play, Pause, RotateCcw, FastForward, Power } from 'lucide-react';

interface SimulationControlsProps {
  engine: PhysicsEngine;
  onReset: () => void;
  onUpdate: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  engine,
  onReset,
  onUpdate,
}) => {
  const togglePause = () => {
    engine.togglePause();
    onUpdate();
  };

  const setTimeWarp = (warp: number) => {
    engine.setTimeWarp(warp);
    onUpdate();
  };

  const handleIntegratorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    engine.setIntegrator(e.target.value as 'verlet' | 'rk4' | 'euler');
    onUpdate();
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 shadow-2xl flex flex-wrap items-center gap-4 text-xs font-mono select-none">
      {/* Simulation Play / Pause Button */}
      <button
        onClick={togglePause}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition active:scale-95 border ${
          engine.isPaused
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-950/40'
            : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-950/40'
        }`}
      >
        {engine.isPaused ? (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>START</span>
          </>
        ) : (
          <>
            <Pause className="w-4 h-4 fill-current" />
            <span>PAUSE</span>
          </>
        )}
      </button>

      {/* Reset Simulation Button */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition active:scale-95"
        title="Reset simulation to initial Low Earth Orbit (Key: R)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>RESET (R)</span>
      </button>

      {/* Time Warp Selector */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1">
          <FastForward className="w-3 h-3 text-sky-400" />
          WARP:
        </span>
        {[1, 10, 100, 1000].map((warp) => (
          <button
            key={warp}
            onClick={() => setTimeWarp(warp)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              engine.timeWarp === warp
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {warp}×
          </button>
        ))}
      </div>

      {/* Numerical Integrator Selector */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <span className="text-[10px]">INTEGRATOR:</span>
        <select
          value={
            engine.integrator.name.includes('Verlet')
              ? 'verlet'
              : engine.integrator.name.includes('RK4')
              ? 'rk4'
              : 'euler'
          }
          onChange={handleIntegratorChange}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-sky-500"
        >
          <option value="verlet">Velocity Verlet (Symplectic)</option>
          <option value="rk4">Runge-Kutta 4 (RK4)</option>
          <option value="euler">Semi-Implicit Euler</option>
        </select>
      </div>

      {/* Engine Toggle Button */}
      <button
        onClick={() => {
          engine.spacecraft.toggleEngine();
          onUpdate();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-semibold active:scale-95 ${
          engine.spacecraft.engineActive
            ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950/40 animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
        }`}
        title="Toggle Rocket Engine (Key: Space)"
      >
        <Power className="w-3.5 h-3.5" />
        <span>ENGINE: {engine.spacecraft.engineActive ? 'ON' : 'OFF'}</span>
      </button>

      {/* Simulation Clock */}
      <div className="ml-auto text-slate-400 text-[11px]">
        T+ <span className="text-slate-100 font-semibold">{formatTime(engine.time)}</span>
      </div>
    </div>
  );
};
