# Orbital Playground

A browser-based 2D orbital mechanics simulator built with React and TypeScript.

Orbital Playground is an interactive educational simulation designed to explore real Newtonian physics and orbital mechanics. Rather than relying on arcade-style movement or scripted paths, spacecraft trajectories and planetary orbits are computed in real time using true gravitational vector fields and numerical integration.

---

## Overview

The simulator places the player in control of a spacecraft in a simplified Earth-Moon-Sun system. The spacecraft begins in a circular Low Earth Orbit (LEO) and can perform burns to adjust periapsis and apoapsis, transfer between celestial bodies, circularize orbits, or achieve escape velocity on hyperbolic trajectories.

### Educational Scaling System

In the real solar system, astronomical distances and planetary sizes span many orders of magnitude:
- Earth's radius is ~6,371 km, while the Moon is ~384,400 km away (~60 Earth radii).
- The Sun is ~149,600,000 km away (~23,500 Earth radii).

Rendering these distances 1:1 on a single screen without logarithmic distortion would make the Earth and Moon invisible sub-pixel specks when viewing the Sun. To make the orbital dynamics immediately observable and visually engaging while strictly preserving real gravitational equations:

1. **Units**: 1 simulation distance unit = 1 kilometer ($1\text{ km} = 10^3\text{ m}$); 1 time unit = 1 second.
2. **Earth**: Radius $R_E = 1,000\text{ km}$ with standard Earth surface gravity $g_0 = 9.81\text{ m/s}^2$ ($\mu_E = 9,810\text{ km}^3/\text{s}^2$).
3. **Moon**: Orbit radius $D_{EM} = 10,000\text{ km}$ (10 Earth radii), radius $R_M = 270\text{ km}$ ($0.27 R_E$, matching real Moon-to-Earth ratio), $\mu_M = 120.6\text{ km}^3/\text{s}^2$ (surface gravity $\approx 1.65\text{ m/s}^2$).
4. **Sun**: Orbit radius $D_{SE} = 150,000\text{ km}$ (15 Earth-Moon distances), radius $R_S = 7,000\text{ km}$, $\mu_S = 2,943,000\text{ km}^3/\text{s}^2$.
5. **Hill Sphere Stability**: Earth's gravitational Hill sphere radius under the Sun's tidal pull is $r_H \approx D_{SE} \sqrt[3]{\frac{\mu_E}{3\mu_S}} \approx 15,530\text{ km}$. Because the Moon orbits at $10,000\text{ km} < 15,530\text{ km}$, the Moon is stably bound inside Earth's Hill sphere without artificial constraints.

---

## Features

- **True Newtonian Gravity**: Multi-body gravitational acceleration from Earth, Moon, and Sun calculated continuously using $F = G \frac{M m}{r^2}$.
- **Numerical Integration**: Modular integrators including 2nd-order **Velocity Verlet** (symplectic, excellent long-term energy conservation), 4th-order **Runge-Kutta (RK4)**, and **Semi-Implicit Euler**.
- **Real-Time Orbit Telemetry (Flight Computer)**:
  - Altitude, Total Velocity, Vertical (Radial) Velocity, Horizontal (Tangential) Velocity.
  - Apoapsis (AP) and Periapsis (PE) altitudes.
  - Orbit Eccentricity ($e$), Specific Orbital Energy ($\epsilon$), and Orbital Period.
  - Active detection and visual flagging of bound elliptical orbits vs. unbound hyperbolic escape trajectories.
- **Dynamic Orbit Conic Projection**: Osculating Keplerian ellipse/hyperbola visualization drawn dynamically in front of the spacecraft, with AP and PE altitude pills.
- **Variable-Mass Rocketry**:
  - Rocket engine with throttle control (0%–100%).
  - Propellant mass decreases as fuel burns, increasing acceleration ($a = F / m$).
  - Particle plume exhaust with realistic dispersion and fading sparks.
  - Prograde and Retrograde alignment autopilot buttons for precise orbital burns.
- **Time Warp with Substepping**: Accelerate time by 1×, 10×, 100×, or 1000×. High time warps automatically subdivide integration steps ($dt_{sub} \le 0.05\text{ s}$) to prevent numerical drift.
- **Interactive Camera**: Smooth zoom, drag-to-pan, "Follow Spacecraft" tracking mode, focus on Earth/Moon/Sun, and quick view reset.
- **Aesthetic Engineering HUD**: Polished dark-space aesthetic, procedural twinkling parallax starfield, celestial body day/night shading, and responsive layout.
- **Collapsible Physics Guide**: Built-in interactive educational modal detailing the mathematics and physics equations.

---

## Physics & Equations

### 1. Newton's Law of Universal Gravitation
The gravitational force between two masses is:

$$F = G \frac{M m}{r^2}$$

The gravitational acceleration experienced by the spacecraft is independent of spacecraft mass:

$$\vec{a}_{grav} = \sum_{i} \frac{G M_i}{\|\vec{r}_i - \vec{r}\|^3} (\vec{r}_i - \vec{r}) = \sum_{i} \frac{\mu_i}{\|\vec{r}_i - \vec{r}\|^3} (\vec{r}_i - \vec{r})$$

where $\mu_i = G M_i$ is the gravitational parameter of body $i$.

### 2. Rocket Propulsion & Tsiolkovsky Equation
Spacecraft thrust acceleration follows Newton's Second Law:

$$\vec{a}_{thrust} = \frac{\vec{F}_{thrust}}{m_{total}}$$

where $m_{total} = m_{dry} + m_{fuel}$. As propellant is consumed at rate $\dot{m} = \frac{F_{thrust}}{I_{sp} g_0}$, total mass decreases, increasing acceleration over time according to Tsiolkovsky's rocket equation:

$$\Delta v = I_{sp} g_0 \ln\left(\frac{m_{initial}}{m_{final}}\right)$$

### 3. Vis-Viva Equation & Orbital Speed
The velocity at any point along an elliptical orbit with semi-major axis $a$ is:

$$v = \sqrt{\mu \left(\frac{2}{r} - \frac{1}{a}\right)}$$

For a circular orbit ($r = a$), this simplifies to:

$$v_{circ} = \sqrt{\frac{\mu}{r}}$$

Escape velocity from radius $r$:

$$v_{esc} = \sqrt{\frac{2\mu}{r}} = \sqrt{2} \cdot v_{circ}$$

### 4. Specific Orbital Energy & Conic Classification
Specific mechanical energy $\epsilon$ is conserved along an unpowered Keplerian orbit:

$$\epsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}$$

- **$\epsilon < 0$ ($e < 1$)**: Elliptical orbit (bound, periodic).
- **$\epsilon = 0$ ($e = 1$)**: Parabolic escape trajectory.
- **$\epsilon > 0$ ($e > 1$)**: Hyperbolic escape trajectory (unbound).

---

## Controls

| Key / Control | Action |
| :--- | :--- |
| **W** / **Up Arrow** | Increase engine throttle |
| **S** / **Down Arrow** | Decrease engine throttle |
| **A** / **Left Arrow** | Rotate spacecraft counter-clockwise |
| **D** / **Right Arrow** | Rotate spacecraft clockwise |
| **Space** | Toggle rocket engine on / off |
| **X** | Cut throttle immediately (0%) |
| **Z** | Full throttle (100%) |
| **1, 2, 3, 4** | Time Warp: 1×, 10×, 100×, 1000× |
| **R** | Reset simulation to initial Low Earth Orbit |
| **Mouse Left Drag** | Pan camera across the solar system |
| **Mouse Wheel** | Zoom in / out centered on cursor |

*On-screen touch controls, throttle presets, and Prograde/Retrograde alignment buttons are also available on the HUD for mobile and mouse-only play.*

---

## Technology

- **React 19**
- **TypeScript 5.8**
- **Vite 8** with `@tailwindcss/vite`
- **Tailwind CSS v4** for clean UI HUD styling
- **HTML5 2D Canvas** with High-DPI (`devicePixelRatio`) support
- **Lucide React** for aerospace telemetry iconography
- **Vitest** for automated unit testing

---

## Project Structure

```
orbital-playground/
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI: install, lint, test, build
│       └── deploy.yml        # GitHub Pages automated deployment
├── src/
│   ├── physics/
│   │   ├── Vector2.ts        # 2D immutable vector math
│   │   ├── Constants.ts      # Physical constants and scaling definitions
│   │   ├── CelestialBody.ts  # Astronomical body & gravity calculations
│   │   ├── Spacecraft.ts     # Spacecraft state, propulsion, variable mass
│   │   ├── Integrator.ts     # Velocity Verlet, RK4, Semi-Implicit Euler
│   │   ├── Orbit.ts          # Keplerian elements & conic curve generator
│   │   ├── PhysicsEngine.ts  # Master N-body engine & substepping loop
│   │   └── __tests__/
│   │       ├── PhysicsEngine.test.ts # Automated physics accuracy tests
│   │       └── Orbit.test.ts         # Orbital math & hyperbolic tests
│   ├── components/
│   │   ├── simulation/
│   │   │   ├── SimulationCanvas.tsx   # Canvas loop & viewport management
│   │   │   ├── SimulationRenderer.ts # Drawing routines & visual layers
│   │   │   ├── Starfield.ts          # Procedural stars with parallax
│   │   │   └── ParticleSystem.ts     # Rocket exhaust particle plume
│   │   └── panels/
│   │       ├── FlightComputer.tsx    # HUD telemetry panel
│   │       ├── SimulationControls.tsx# Play/Pause, Warp, Integrator selector
│   │       ├── CameraControls.tsx    # Camera targeting & zoom
│   │       ├── PhysicsGuideModal.tsx # Educational theory modal
│   │       └── KeyboardHelp.tsx      # Hotkey reference modal
│   ├── utils/
│   │   └── formatters.ts     # Aerospace unit formatters (km, m/s, G, time)
│   ├── App.tsx               # Main application container
│   ├── main.tsx              # React DOM entrypoint
│   └── index.css             # Tailwind base styles
├── vite.config.ts            # Vite configuration with Vitest & GH Pages base
└── package.json
```

---

## Running Locally

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup
```bash
# 1. Clone repository
git clone https://github.com/<username>/orbital-playground.git
cd orbital-playground

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Testing

Automated tests verify physical accuracy and numerical stability:

```bash
npm run test
```

### Verified Physics Properties:
1. **Inverse-Square Law**: Gravitational acceleration decreases as $1/r^2$.
2. **Zero-Thrust Invariance**: No artificial acceleration without active thrust.
3. **Gravitational Symmetry**: Symmetrically placed masses cancel out correctly.
4. **Thrust & Mass Proportionality**: $a = F / m$ scales linearly with throttle and inversely with total mass.
5. **Orbital Boundedness**: A circular orbit integrated over a full period remains bounded within 0.1% radius deviation.
6. **Energy Conservation**: Specific orbital energy remains conserved within 0.01% error under Velocity Verlet and RK4 integration.
7. **Hyperbolic Escape Trajectory**: Correct detection and parameterization when spacecraft velocity exceeds escape velocity.

### Production Build & Linting
```bash
# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## Future Improvements

- Transfer orbit / Hohmann maneuver planning nodes (interactive $\Delta v$ gizmos).
- Atmospheric drag modeling for low Earth entry (aerobraking).
- Trajectory prediction incorporating lunar gravity assists (Patched Conics or N-body predictor line).
- Sound effects for rocket engines, staging, and ambient space music.

---

## License

MIT License. Feel free to use, modify, and distribute for educational or personal projects.
