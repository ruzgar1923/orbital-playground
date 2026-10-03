import React from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import {
  formatDistance,
  formatSpeed,
  formatTime,
  formatAngleDegrees,
} from '../../utils/formatters';
import {
  Compass,
  Flame,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface FlightComputerProps {
  engine: PhysicsEngine;
}

export const FlightComputer: React.FC<FlightComputerProps> = ({ engine }) => {
  const elements = engine.getOrbitalElements();
  const sc = engine.spacecraft;
  const primary = elements.primaryBody;

  const fuelPct = Math.max(0, Math.min(100, (sc.fuelMass / sc.maxFuelMass) * 100));

  // Determine orbit status description
  let orbitStatus = 'STABLE ORBIT';
  let orbitStatusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

  if (elements.isHyperbolic) {
    orbitStatus = 'HYPERBOLIC ESCAPE';
    orbitStatusColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
  } else if (elements.periapsisAltitude < 0) {
    orbitStatus = 'SUBCRITICAL / IMPACT';
    orbitStatusColor = 'text-rose-400 bg-rose-950/60 border-rose-800';
  } else if (elements.eccentricity < 0.05) {
    orbitStatus = 'CIRCULAR ORBIT';
    orbitStatusColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
  }

  const alignPrograde = () => {
    engine.alignPrograde();
  };

  const alignRetrograde = () => {
    engine.alignRetrograde();
  };

  return (
    <div className="w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 text-slate-200 shadow-2xl flex flex-col gap-3 font-sans text-xs select-none">
      {/* Header with Primary Body and Orbit State */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <span className="font-mono font-semibold tracking-wider text-slate-300">
            TARGET: <span className="text-sky-300 font-bold">{primary.name.toUpperCase()}</span>
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-mono border ${orbitStatusColor}`}>
          {orbitStatus}
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">ALTITUDE</span>
          <span className="text-sm font-semibold text-slate-100">
            {formatDistance(elements.altitude)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">VELOCITY</span>
          <span className="text-sm font-semibold text-sky-300">
            {formatSpeed(elements.speed)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight flex items-center gap-1">
            {elements.radialVelocity >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-400 inline" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-amber-400 inline" />
            )}
            VERT VEL (RADIAL)
          </span>
          <span className="text-xs text-slate-200">
            {formatSpeed(elements.radialVelocity)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">HORIZ VEL (TANG)</span>
          <span className="text-xs text-slate-200">
            {formatSpeed(elements.tangentialVelocity)}
          </span>
        </div>
      </div>

      {/* Conic Elements */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">APOAPSIS (AP)</span>
          <span className="text-xs font-medium text-sky-400">
            {elements.apoapsisAltitude !== null ? formatDistance(elements.apoapsisAltitude) : 'ESCAPE (∞)'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">PERIAPSIS (PE)</span>
          <span className={`text-xs font-medium ${elements.periapsisAltitude < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatDistance(elements.periapsisAltitude)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">ECCENTRICITY (e)</span>
          <span className="text-xs text-slate-200">
            {elements.eccentricity.toFixed(4)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block tracking-tight">ORBITAL PERIOD</span>
          <span className="text-xs text-slate-200">
            {elements.periodSeconds ? formatTime(elements.periodSeconds) : 'N/A'}
          </span>
        </div>

        <div className="col-span-2 pt-1 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
          <span className="text-slate-400">SPECIFIC ENERGY (ε)</span>
          <span className="text-slate-300 font-mono">
            {elements.specificEnergy.toFixed(2)} km²/s²
          </span>
        </div>
      </div>

      {/* Propulsion & Fuel Panel */}
      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold">PROPULSION & FUEL</span>
          </div>
          <span className="font-mono text-xs font-bold text-amber-300">
            {sc.fuelMass.toFixed(0)} kg ({fuelPct.toFixed(0)}%)
          </span>
        </div>

        {/* Fuel Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              fuelPct > 40
                ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                : fuelPct > 15
                ? 'bg-amber-500'
                : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${fuelPct}%` }}
          />
        </div>

        {/* Throttle Controls */}
        <div className="flex items-center justify-between font-mono text-[11px] pt-1">
          <span className="text-slate-400">THROTTLE:</span>
          <span className="font-bold text-sky-400">{(sc.throttle * 100).toFixed(0)}%</span>
          <span className="text-slate-400">THRUST:</span>
          <span className="text-slate-200">{sc.currentThrustForce.toFixed(1)} kN</span>
        </div>

        {/* Throttle quick buttons */}
        <div className="grid grid-cols-4 gap-1 pt-1 font-mono text-[10px]">
          <button
            onClick={() => engine.cutThrottle()}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 active:scale-95 transition"
            title="Cut Throttle (Key: X)"
          >
            0% (X)
          </button>
          <button
            onClick={() => engine.setThrottle(0.33)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 active:scale-95 transition"
          >
            33%
          </button>
          <button
            onClick={() => engine.setThrottle(0.66)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 active:scale-95 transition"
          >
            66%
          </button>
          <button
            onClick={() => engine.fullThrottle()}
            className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800/80 text-sky-200 rounded border border-sky-700 active:scale-95 transition font-semibold"
            title="Full Throttle (Key: Z)"
          >
            100% (Z)
          </button>
        </div>
      </div>

      {/* Attitude & Autopilot Assist */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>HEADING: {formatAngleDegrees(sc.rotation)}</span>
        </div>

        <div className="flex gap-1.5 font-mono text-[10px]">
          <button
            onClick={alignPrograde}
            className="px-2 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded transition active:scale-95"
            title="Align spacecraft with velocity vector"
          >
            PROGRADE
          </button>
          <button
            onClick={alignRetrograde}
            className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded transition active:scale-95"
            title="Align spacecraft opposite to velocity vector (burn to lower orbit)"
          >
            RETROGRADE
          </button>
        </div>
      </div>
    </div>
  );
};
