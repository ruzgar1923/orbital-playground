import React, { useState } from 'react';
import { PhysicsEngine } from '../../physics/PhysicsEngine';
import { SCENARIOS } from '../../simulation/Scenario';
import { Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface MissionPanelProps {
  engine: PhysicsEngine;
  onScenarioSelect: (index: number) => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ engine, onScenarioSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentScenario = engine.currentScenario;
  const status = currentScenario.checkCompletion(engine.spacecraft, engine.earth, engine.moon);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-slate-200 shadow-2xl font-mono text-xs select-none max-w-sm">
      {/* Header with scenario title & completion badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-400 font-bold tracking-wider">
              {currentScenario.number}: {currentScenario.title.toUpperCase()}
            </div>
            <div className="text-[9px] text-slate-400">{currentScenario.subtitle}</div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
          title="Toggle mission details"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Live objective status bar */}
      <div className="mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">STATUS:</span>
        <span
          className={`font-semibold flex items-center gap-1 ${
            status.completed ? 'text-emerald-400 font-bold' : 'text-slate-200'
          }`}
        >
          {status.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
          {status.progress}
        </span>
      </div>

      {/* Expanded details & scenario switch list */}
      {isExpanded && (
        <div className="mt-3 space-y-3 pt-2 border-t border-slate-800 text-[10px]">
          <div>
            <span className="text-slate-400 block mb-1 font-semibold">OBJECTIVES:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {currentScenario.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-slate-400 block mb-1.5 font-semibold">SWITCH MISSION:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENARIOS.map((scen, idx) => (
                <button
                  key={scen.id}
                  onClick={() => onScenarioSelect(idx)}
                  className={`p-1.5 rounded border text-left transition ${
                    engine.activeScenarioIndex === idx
                      ? 'bg-sky-600/90 border-sky-400 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div className="text-[9px] text-sky-300">{scen.number}</div>
                  <div className="truncate font-semibold">{scen.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
