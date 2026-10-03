import React, { useState } from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import {
  formatDistance,
  formatSpeed,
  formatTime,
  formatMass,
  formatAngleDegrees,
} from '../../utils/formatters';
import {
  Compass,
  Flame,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
  Wind,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface FlightComputerProps {
  engine: PhysicsEngine;
}

export const FlightComputer: React.FC<FlightComputerProps> = ({ engine }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const elements = engine.getOrbitalElements();
  const sc = engine.spacecraft;
  const primary = elements.primaryBody;
  const aero = engine.latestAerodynamics;

  const activeStage = sc.activeStage;
  const fuelPct =
    activeStage && activeStage.maxFuelMassKg > 0
      ? (activeStage.fuelMassKg / activeStage.maxFuelMassKg) * 100
      : 0;

  let orbitStatus = 'STABLE ORBIT';
  let orbitStatusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

  if (sc.isLanded) {
    orbitStatus = sc.landedBodyId === 'moon' ? 'LUNAR SURFACE' : 'LAUNCH PAD 39A';
    orbitStatusColor = 'text-sky-400 bg-sky-950/60 border-sky-800';
  } else if (elements.isHyperbolic) {
    orbitStatus = 'HYPERBOLIC ESCAPE';
    orbitStatusColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
  } else if (elements.isSuborbital) {
    orbitStatus = 'SUBORBITAL TRAJECTORY';
    orbitStatusColor = 'text-rose-400 bg-rose-950/60 border-rose-800';
  } else if (elements.eccentricity < 0.04) {
    orbitStatus = 'CIRCULAR ORBIT';
    orbitStatusColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
  }

  // Format thrust in kN or MN
  const ambientPressure =
    primary.id === 'earth' && elements.altitude < 120000
      ? 101325 * Math.exp(-elements.altitude / 8500)
      : 0;
  const currentThrustN = sc.getCurrentThrustN(ambientPressure);
  const thrustDisplay =
    currentThrustN >= 1e6
      ? `${(currentThrustN / 1e6).toFixed(2)} MN`
      : `${(currentThrustN / 1e3).toFixed(0)} kN`;

  return (
    <div className="w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 text-slate-200 shadow-2xl flex flex-col gap-2.5 font-mono text-xs select-none">
      {/* Header with Target Body, Status, and Collapse Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <span className="font-semibold tracking-wider text-slate-300">
            TARGET: <span className="text-sky-300 font-bold">{primary.name.toUpperCase()}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-0.5 rounded text-[10px] border ${orbitStatusColor}`}>
            {orbitStatus}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
            title={isCollapsed ? 'Expand Flight Computer' : 'Collapse Flight Computer'}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Telemetry Readouts */}
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">ALTITUDE</span>
              <span className="text-sm font-semibold text-slate-100">
                {formatDistance(elements.altitude / 1000)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">VELOCITY</span>
              <span className="text-sm font-semibold text-sky-300">
                {formatSpeed(elements.speed / 1000)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight flex items-center gap-1">
                {elements.radialVelocity >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400 inline" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-amber-400 inline" />
                )}
                VERTICAL (RADIAL)
              </span>
              <span className="text-xs text-slate-200">
                {formatSpeed(elements.radialVelocity / 1000)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">HORIZONTAL</span>
              <span className="text-xs text-slate-200">
                {formatSpeed(elements.tangentialVelocity / 1000)}
              </span>
            </div>
          </div>

          {/* Orbital Parameters */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">APOAPSIS (AP)</span>
              <span className="text-xs font-semibold text-sky-400">
                {elements.apoapsisAltitude !== null
                  ? formatDistance(elements.apoapsisAltitude / 1000)
                  : 'ESCAPE (∞)'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">PERIAPSIS (PE)</span>
              <span
                className={`text-xs font-semibold ${
                  elements.periapsisAltitude < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {elements.periapsisAltitude < 0
                  ? `SUBORBITAL (${formatDistance(elements.periapsisAltitude / 1000)})`
                  : formatDistance(elements.periapsisAltitude / 1000)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">ECCENTRICITY (e)</span>
              <span className="text-xs text-slate-200">{elements.eccentricity.toFixed(4)}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block tracking-tight">ORBITAL PERIOD</span>
              <span className="text-xs text-slate-200">
                {elements.periodSeconds ? formatTime(elements.periodSeconds) : 'N/A'}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
              <span className="text-slate-400">TOTAL VEHICLE MASS</span>
              <span className="text-slate-200 font-semibold">{formatMass(sc.totalMassKg)}</span>
            </div>
          </div>

          {/* Aerodynamics / Dynamic Pressure (Max Q) */}
          {primary.id === 'earth' && elements.altitude < 120000 && aero && (
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-slate-400">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>DYNAMIC PRESSURE (q):</span>
              </div>
              <span className="text-slate-200 font-semibold">
                {(aero.dynamicPressure / 1000).toFixed(1)} kPa (Mach {aero.machNumber.toFixed(1)})
              </span>
            </div>
          )}

          {/* Propulsion & Fuel */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold">
                  {activeStage ? activeStage.name : 'NO ACTIVE STAGE'}
                </span>
              </div>
              <span className="font-bold text-amber-300">
                {fuelPct.toFixed(0)}% ({formatMass(sc.activeStageFuelKg)})
              </span>
            </div>

            {/* Fuel Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  fuelPct > 35
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    : fuelPct > 15
                    ? 'bg-amber-500'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${fuelPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">THROTTLE:</span>
              <span className="font-bold text-sky-400">{(sc.throttle * 100).toFixed(0)}%</span>
              <span className="text-slate-400">THRUST:</span>
              <span className="text-slate-200">{thrustDisplay}</span>
            </div>

            {/* Throttle Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1 text-[10px]">
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

          {/* Autopilot Attitude Alignments */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>HEADING: {formatAngleDegrees(sc.rotation)}</span>
            </div>

            <div className="flex gap-1.5 text-[10px]">
              <button
                onClick={() => engine.alignPrograde()}
                className="px-2 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded transition active:scale-95 font-semibold"
                title="Align with orbital velocity vector"
              >
                PROGRADE
              </button>
              <button
                onClick={() => engine.alignRetrograde()}
                className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded transition active:scale-95 font-semibold"
                title="Align opposite to velocity vector (burn to lower orbit)"
              >
                RETROGRADE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
