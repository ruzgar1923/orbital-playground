import React, { useState } from 'react';
import { BookOpen, X, Atom, Compass, Orbit, Rocket, Cpu } from 'lucide-react';

export const PhysicsGuideModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono transition active:scale-95"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>PHYSICS GUIDE</span>
      </button>

      {/* Slide-out or Modal Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-bold font-mono tracking-wide text-slate-100">
                  ORBITAL MECHANICS & SIMULATION PHYSICS
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-5 space-y-4 text-xs leading-relaxed">
              {/* Newton's Law of Universal Gravitation */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-mono font-bold text-sky-400 mb-1.5">
                  <Orbit className="w-4 h-4" />
                  <span>1. Newton's Law of Universal Gravitation</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Every celestial body exerts an attractive gravitational force on other masses proportional to the product of their masses and inversely proportional to the square of the distance between them:
                </p>
                <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-sky-300 text-center font-bold text-sm">
                  F = G · (M · m) / r²
                </div>
                <p className="text-slate-400 mt-2">
                  Gravitational acceleration of the spacecraft depends solely on the primary body's mass and distance: <span className="font-mono text-slate-200">a = G · M / r² = μ / r²</span>.
                </p>
              </div>

              {/* Orbital Velocity & Vis-Viva Equation */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 mb-1.5">
                  <Compass className="w-4 h-4" />
                  <span>2. Orbital Velocity & Vis-Viva Equation</span>
                </div>
                <p className="text-slate-300 mb-2">
                  In a 2-body Keplerian orbit, the orbital velocity at any radius <span className="font-mono text-slate-200">r</span> along an orbit with semi-major axis <span className="font-mono text-slate-200">a</span> is governed by the Vis-Viva equation:
                </p>
                <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-300 text-center font-bold text-sm">
                  v = √( μ · (2/r - 1/a) )
                </div>
                <p className="text-slate-400 mt-2">
                  For a circular orbit (<span className="font-mono text-slate-200">r = a</span>), this simplifies to: <span className="font-mono text-slate-200">v_circ = √(μ / r)</span>. For escape velocity: <span className="font-mono text-slate-200">v_esc = √(2μ / r) = √2 · v_circ</span>.
                </p>
              </div>

              {/* Specific Orbital Energy & Conic Sections */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400 mb-1.5">
                  <Atom className="w-4 h-4" />
                  <span>3. Specific Orbital Energy & Conic Sections</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Specific orbital energy <span className="font-mono text-slate-200">ε</span> is the sum of specific kinetic energy and specific gravitational potential energy:
                </p>
                <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-amber-300 text-center font-bold text-sm">
                  ε = v² / 2 - μ / r = -μ / (2a)
                </div>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
                  <li><span className="font-mono text-emerald-400">ε &lt; 0 (e &lt; 1)</span>: Bound elliptical or circular orbit (finite period, both AP and PE exist).</li>
                  <li><span className="font-mono text-amber-400">ε = 0 (e = 1)</span>: Parabolic escape trajectory.</li>
                  <li><span className="font-mono text-rose-400">ε &gt; 0 (e &gt; 1)</span>: Hyperbolic escape trajectory (infinite AP, leaves the system).</li>
                </ul>
              </div>

              {/* Rocket Propulsion & Variable Mass */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-mono font-bold text-rose-400 mb-1.5">
                  <Rocket className="w-4 h-4" />
                  <span>4. Rocket Propulsion & Variable Mass</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Newton's Second Law dictates acceleration from rocket thrust: <span className="font-mono text-slate-200">a = F_thrust / m</span>. As the engine fires, fuel mass decreases according to the mass flow rate:
                </p>
                <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-rose-300 text-center font-bold text-sm">
                  Δv = I_sp · g₀ · ln( m_initial / m_final )
                </div>
                <p className="text-slate-400 mt-2">
                  Burning fuel reduces the spacecraft's total mass, resulting in higher acceleration for the same engine thrust as propellant depletes.
                </p>
              </div>

              {/* Numerical Integration & Substepping */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-mono font-bold text-purple-400 mb-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>5. Numerical Integration & Time Warp Substepping</span>
                </div>
                <p className="text-slate-300">
                  Because real astronomical N-body gravitational differential equations have no general closed-form analytical solution, this simulator uses numerical integration.
                </p>
                <p className="text-slate-300 mt-2">
                  By default, the engine uses the <strong className="text-sky-300">Velocity Verlet</strong> integrator—a second-order symplectic method that conserves phase-space volume and maintains strict energy conservation over thousands of orbital periods. When running at high time warps (10× to 1000×), the engine slices the time step into small sub-steps (<span className="font-mono text-slate-200">dt ≤ 0.05s</span>) to prevent energy drift.
                </p>
              </div>

              {/* Scale System */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="font-mono font-bold text-slate-300 mb-1">
                  Simulation Scale System
                </div>
                <p className="text-slate-400">
                  1 distance unit = 1 km. Earth radius is normalized to 1,000 km with real surface gravity (9.81 m/s²). The Moon (10,000 km) and Sun (150,000 km) are scaled so all bodies remain visibly interactive on screen while strictly preserving real gravitational equations and Hill sphere stability.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded-lg transition"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
