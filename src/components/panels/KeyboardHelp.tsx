import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export const KeyboardHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono transition active:scale-95"
      >
        <Keyboard className="w-3.5 h-3.5 text-sky-400" />
        <span>CONTROLS</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl text-slate-200 overflow-hidden font-sans">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold font-mono text-slate-100">KEYBOARD & FLIGHT CONTROLS</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Increase Throttle</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">W / ↑</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Reduce Throttle</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">S / ↓</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Rotate CCW / Left</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">A / ←</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Rotate CW / Right</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">D / →</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Toggle Engine</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">SPACE</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Cut Throttle (0%)</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">X</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Full Throttle (100%)</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">Z</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Time Warp (1x, 10x, 100x, 1000x)</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">1, 2, 3, 4</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Reset Simulation</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">R</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Pan View / Zoom View</span>
                <span className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">Click & Drag / Wheel</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
