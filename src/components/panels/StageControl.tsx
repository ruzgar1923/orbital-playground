import React from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { Layers, ChevronRight, AlertCircle } from 'lucide-react';

interface StageControlProps {
  engine: PhysicsEngine;
  onUpdate: () => void;
}

export const StageControl: React.FC<StageControlProps> = ({ engine, onUpdate }) => {
  const sc = engine.spacecraft;
  const activeIdx = sc.activeStageIndex;
  const activeStage = sc.activeStage;

  const handleStage = () => {
    engine.stage();
    onUpdate();
  };

  const isFinalStage = activeIdx >= sc.stages.length - 1;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-slate-200 shadow-2xl flex flex-col gap-2 font-mono text-xs select-none min-w-[200px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>STAGING SEQUENCE</span>
        </div>
        <span className="text-[10px] text-sky-400 font-bold">
          STAGE {activeIdx + 1} / {sc.stages.length}
        </span>
      </div>

      {/* Stage Stack List */}
      <div className="flex flex-col gap-1.5 my-1">
        {sc.stages.map((stage, idx) => {
          const isCurrent = idx === activeIdx;
          const isSpent = idx < activeIdx;

          const fuelPct = (stage.fuelMassKg / stage.maxFuelMassKg) * 100;

          return (
            <div
              key={stage.id}
              className={`p-1.5 rounded-lg border text-[10px] transition ${
                isCurrent
                  ? 'bg-slate-800/90 border-amber-500/80 text-white shadow-md'
                  : isSpent
                  ? 'bg-slate-950/40 border-slate-800/40 text-slate-500 line-through'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold flex items-center gap-1">
                  {isCurrent && <ChevronRight className="w-3 h-3 text-amber-400 inline" />}
                  {stage.name}
                </span>
                <span className="font-mono text-[9px]">
                  {isSpent ? 'JETTISONED' : `${fuelPct.toFixed(0)}% FUEL`}
                </span>
              </div>

              {!isSpent && (
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-100 ${
                      fuelPct > 35 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${fuelPct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Big SFS-style STAGE Separation Button */}
      <button
        onClick={handleStage}
        disabled={isFinalStage}
        className={`w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 border shadow-lg ${
          isFinalStage
            ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
            : activeStage && activeStage.fuelMassKg <= 0
            ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white animate-bounce'
            : 'bg-sky-600 hover:bg-sky-500 border-sky-400 text-white'
        }`}
        title={isFinalStage ? 'Final stage active' : 'Separate current stage (Backspace)'}
      >
        <Layers className="w-4 h-4" />
        <span>{isFinalStage ? 'FINAL STAGE' : 'STAGE SEPARATION'}</span>
      </button>

      {activeStage && activeStage.fuelMassKg <= 0 && !isFinalStage && (
        <div className="flex items-center gap-1 text-[10px] text-amber-300 mt-0.5">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span>Stage fuel depleted! Ready to stage.</span>
        </div>
      )}
    </div>
  );
};
