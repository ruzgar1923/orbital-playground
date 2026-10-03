import React, { useState } from 'react';
import { Rocket, X, ShieldCheck } from 'lucide-react';

export const VehicleViewerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono transition active:scale-95"
        title="View historical Saturn V & N1 technical blueprint reference"
      >
        <Rocket className="w-3.5 h-3.5" />
        <span>VEHICLE BLUEPRINT</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold font-mono tracking-wide text-slate-100">
                    HISTORICAL ROCKET BLUEPRINT & TECHNICAL SPECIFICATIONS
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Apollo Saturn V (USA) vs N1-L3 (USSR) Lunar Launch Vehicles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blueprint Image */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-400 mb-2 font-semibold self-start">
                    TECHNICAL LINE BLUEPRINT (PRIMARY VISUAL REFERENCE)
                  </div>
                  <div className="bg-white p-2 rounded-lg max-h-[550px] overflow-auto">
                    <img
                      src="./assets/rockets/saturn_v_n1_reference.png"
                      alt="Saturn V and N1 technical blueprint"
                      className="max-h-[500px] object-contain mx-auto"
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2 text-center">
                    Left: Apollo Saturn V (110.6 m) | Right: Soviet N1 Moon Rocket (105 m)
                  </div>
                </div>

                {/* Technical Specs & Staging Details */}
                <div className="space-y-3">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-amber-400 font-bold text-xs mb-1">
                      SATURN V FLIGHT STACK BREAKDOWN
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2">
                      The Saturn V Apollo vehicle was a three-stage super-heavy liquid-propellant launch vehicle developed by NASA under the direction of Wernher von Braun. It stood 110.6 m tall and remains the only rocket to carry humans beyond low Earth orbit.
                    </p>

                    <div className="space-y-1.5 text-[10px]">
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <strong className="text-sky-300">Stage 1: S-IC</strong>
                        <div>Engines: 5x Rocketdyne F-1 (RP-1/LOX)</div>
                        <div>Thrust: 35.1 MN (Sea Level) / 38.7 MN (Vacuum)</div>
                        <div>Propellant: 2,160 metric tons | Dry mass: 131 metric tons</div>
                      </div>

                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <strong className="text-sky-300">Stage 2: S-II</strong>
                        <div>Engines: 5x Rocketdyne J-2 (LH2/LOX Hydrolox)</div>
                        <div>Thrust: 5.14 MN (Vacuum) | Isp: 421 s</div>
                        <div>Propellant: 450 metric tons | Dry mass: 40 metric tons</div>
                      </div>

                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <strong className="text-sky-300">Stage 3: S-IVB</strong>
                        <div>Engines: 1x Rocketdyne J-2 (Restartable)</div>
                        <div>Thrust: 1.0 MN (Vacuum) | Isp: 421 s</div>
                        <div>Performs orbital insertion & Translunar Injection (TLI)</div>
                      </div>

                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <strong className="text-sky-300">Payload: Apollo CSM & LM</strong>
                        <div>Service Module SPS Engine: 91 kN, Isp: 314 s</div>
                        <div>Command Module (heat shield cone for atmospheric reentry)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[10px] space-y-1">
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SIMULATION FIDELITY & ATTRIBUTION</span>
                    </div>
                    <p className="text-slate-400 font-sans leading-relaxed">
                      All rocket masses, thrust curves, specific impulses, and aerodynamic drag areas in Orbital Playground are derived directly from documented NASA Technical Reports (SP-4029 & Saturn V Flight Manual). See <span className="text-sky-300 font-mono">CREDITS.md</span> for full public-domain documentation citations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded-lg transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
