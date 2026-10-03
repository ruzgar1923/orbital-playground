import type { CameraTarget } from '../../rendering/Camera';
import { RotateCcw, ZoomIn, ZoomOut, Rocket, Eye } from 'lucide-react';

interface CameraControlsProps {
  cameraTarget: CameraTarget;
  onTargetChange: (target: CameraTarget) => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraTarget,
  onTargetChange,
  onResetView,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-slate-200 shadow-2xl flex flex-col gap-2 font-mono text-xs select-none">
      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pb-1 border-b border-slate-800">
        <Eye className="w-3.5 h-3.5 text-sky-400" />
        <span>CAMERA & TRACKING</span>
      </div>

      {/* Target Focus Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onTargetChange('spacecraft')}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition active:scale-95 ${
            cameraTarget === 'spacecraft'
              ? 'bg-sky-600 border-sky-400 text-white shadow'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
          }`}
          title="Track spacecraft continuously"
        >
          <Rocket className="w-3 h-3" />
          <span>Follow Ship</span>
        </button>

        <button
          onClick={onResetView}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition active:scale-95"
          title="Reset zoom and center on Low Earth Orbit"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset View</span>
        </button>

        <button
          onClick={() => onTargetChange('earth')}
          className={`px-2 py-1 rounded border text-[10px] transition ${
            cameraTarget === 'earth'
              ? 'bg-sky-600 border-sky-400 text-white font-semibold'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus Earth
        </button>

        <button
          onClick={() => onTargetChange('moon')}
          className={`px-2 py-1 rounded border text-[10px] transition ${
            cameraTarget === 'moon'
              ? 'bg-sky-600 border-sky-400 text-white font-semibold'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus Moon
        </button>
      </div>

      {/* Zoom In & Out */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
        <span className="text-[10px] text-slate-400">ZOOM:</span>
        <div className="flex gap-1">
          <button
            onClick={onZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
