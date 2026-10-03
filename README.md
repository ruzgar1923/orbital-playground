# Orbital Playground

A technically serious, educational, browser-based spaceflight simulator built with **React**, **TypeScript**, **Vite**, and **HTML5 Canvas**.

Inspired by the interaction philosophy and physics sandbox depth of spaceflight simulators, **Orbital Playground** is built with **real SI physical units** (meters, kilograms, seconds, Newtons), scientifically documented solar system parameters, real atmospheric drag, multi-stage rocketry, and multi-body Newtonian gravity.

---

## 1. Overview & Core Philosophy

Rather than normalizing physics into arbitrary game units or using pre-baked orbital curves, **Orbital Playground** computes all kinematics and dynamics directly from Newtonian differential equations:

* **Real SI Units**: All internal computations use meters ($m$), kilograms ($kg$), seconds ($s$), Newtons ($N$), and meters per second ($m/s$).
* **Real-Scale Solar System**: Real astronomical radii, masses, standard gravitational parameters ($\mu = GM$), and orbital semi-major axes for the Sun, Earth, and Moon.
* **Surface-to-Orbit Launch**: Launch from Kennedy Space Center (Pad 39A) on Earth's surface, account for Earth's axial rotation, fly an aerodynamic gravity turn through the atmosphere, stage spent rocket tanks, and circularize into Low Earth Orbit (LEO).
* **Deep Space & Lunar Missions**: Perform Translunar Injection (TLI), travel across the $384,400\text{ km}$ translunar void, capture into Lunar Orbit (LOI), and perform a powered lunar descent to touchdown safely on the Moon.

---

## 2. Multi-Scale Camera & Floating-Origin Rendering

Astronomical spaceflight presents an extreme scale challenge:
* A rocket component is $2\text{ to }10\text{ meters}$.
* Low Earth Orbit altitude is $200,000\text{ meters}$ above a $6,371,000\text{ meter}$ globe.
* The Moon orbits at $384,400,000\text{ meters}$ from Earth.
* The Earth orbits the Sun at $149,600,000,000\text{ meters}$.

In standard 32-bit floating-point rendering, astronomical distances cause severe jitter ("z-fighting" and vertex tearing) when viewing small objects. **Orbital Playground** solves this using:

1. **Double-Precision Simulation**: All orbital mechanics and body coordinates use IEEE-754 64-bit double precision, providing sub-millimeter precision across the Earth-Moon system.
2. **Camera-Relative Rendering (Floating Origin)**: World coordinates are translated relative to the active camera position ($\vec{r}_{render} = \vec{r}_{world} - \vec{r}_{cam}$) before conversion to viewport pixels, guaranteeing zero jitter at all zoom levels.
3. **Multi-Scale Level of Detail (LOD)**:
   * **Planetary LOD (Earth & Moon)**: Outer orbital views render spherical globes with rotating continents, clouds, and day/night terminators. Approaching the surface seamlessly transitions to high-resolution local terrain, Pad 39A launch towers, coastal water, and lunar impact craters.
   * **Vehicle LOD**: Close-up view renders full technical blueprint details (engines, fins, corrugation, roll patterns). Zoomed-out views automatically render a clean orientation reticle and velocity chevron.

---

## 3. The Rocket: Apollo Saturn V Technical Reconstruction

The starting launch vehicle is an original, technical reconstruction of the **Apollo Saturn V** super-heavy rocket, modeled directly after NASA historical documentation (SP-4029):

* **Stage 1 (S-IC)**:
  * 5 $\times$ Rocketdyne F-1 engines ($35.1\text{ MN}$ sea level, $38.7\text{ MN}$ vacuum, $I_{sp} = 263\text{ s} - 304\text{ s}$).
  * 4 aerodynamic stabilization fins, retro-rocket fairings, black-and-white roll tracking patterns.
  * Launch mass: $\sim 2,291\text{ metric tons}$.
* **Stage 2 (S-II)**:
  * 5 $\times$ Rocketdyne J-2 hydrolox engines ($5.14\text{ MN}$ vacuum, $I_{sp} = 421\text{ s}$).
  * Corrugated tank insulation and upper roll tracking band.
* **Stage 3 (S-IVB)**:
  * 1 $\times$ restartable Rocketdyne J-2 engine ($1.0\text{ MN}$ vacuum, $I_{sp} = 421\text{ s}$) and Instrument Unit (IU).
  * Performs Earth orbit insertion and Translunar Injection (TLI).
* **Payload (Apollo CSM & LM)**:
  * Service Module SPS engine ($91\text{ kN}$, $I_{sp} = 314\text{ s}$) and Command Module conical heat shield.
  * Lunar Module descent engine for powered touchdown.

*A technical blueprint and specification viewer is accessible directly in the simulator via the **"Vehicle Blueprint"** button.*

---

## 4. Physics & Equations

### Gravitational Acceleration (N-Body)
$$\vec{a}_{grav} = \sum_{i} \frac{G M_i}{\|\vec{r}_i - \vec{r}\|^3} (\vec{r}_i - \vec{r}) = \sum_{i} \frac{\mu_i}{\|\vec{r}_i - \vec{r}\|^3} (\vec{r}_i - \vec{r})$$

### Atmospheric Model & Aerodynamic Drag
Based on the US Standard Atmosphere (1976) exponential scale-height model:
$$\rho(h) = \rho_0 \exp\left(-\frac{h}{H}\right), \quad H \approx 8,500\text{ m}, \quad \rho_0 = 1.225\text{ kg/m}^3$$
$$\vec{F}_{drag} = \frac{1}{2} \rho \|\vec{v}_{rel}\|^2 C_d A (-\hat{v}_{rel}), \quad q = \frac{1}{2} \rho \|\vec{v}_{rel}\|^2$$
where $\vec{v}_{rel} = \vec{v} - \vec{v}_{atmosphere}$ accounts for Earth's axial rotation ($v_{surface} \approx 408\text{ m/s}$ East at Pad 39A).

### Rocket Propulsion & Tsiolkovsky Equation
$$\vec{a}_{thrust} = \frac{\vec{F}_{thrust}}{m_{dry} + m_{fuel}}, \quad \dot{m} = \frac{F_{thrust}}{I_{sp} \cdot g_0}$$
$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_{initial}}{m_{final}}\right)$$

### Vis-Viva Equation & Specific Orbital Energy
$$v = \sqrt{\mu \left(\frac{2}{r} - \frac{1}{a}\right)}, \quad \epsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}$$

---

## 5. Mission Scenarios

1. **MISSION 01: Earth Orbit (Launch to LEO)**: Start on Launch Pad 39A. Ignite the S-IC first stage, fly through Max Q, stage spent tanks, and circularize into Low Earth Orbit ($h > 160\text{ km}$, $v \approx 7.8\text{ km/s}$).
2. **MISSION 02: Translunar Injection (TLI)**: Re-ignite the S-IVB third stage in LEO to accelerate to $\sim 10.8\text{ km/s}$, escaping Earth onto a trajectory toward the Moon.
3. **MISSION 03: Lunar Orbit Insertion (LOI)**: Arrive near the Moon on a hyperbolic flyby. Perform a retrograde burn with the Apollo Service Module SPS engine into a circular 100 km lunar orbit.
4. **MISSION 04: Lunar Landing**: Control descent from 5,000 meters altitude above the Moon. Kill horizontal velocity, throttle the descent engine, and touch down safely at $< 4.0\text{ m/s}$ vertical speed.

---

## 6. Flight Controls

| Key / Control | Function |
| :--- | :--- |
| **W** / **Up Arrow** | Increase throttle (% Throttle UP) |
| **S** / **Down Arrow** | Decrease throttle (% Throttle DOWN) |
| **A** / **Left Arrow** | Rotate counter-clockwise (Pitch Up / West) |
| **D** / **Right Arrow** | Rotate clockwise (Pitch Down / East) |
| **Space** | Toggle rocket engine ignition |
| **Stage Button** | Jettison current stage and activate next stage |
| **X** | Cut throttle immediately (0%) |
| **Z** | Full throttle (100%) |
| **1 – 6** | Time Warp: 1×, 10×, 100×, 1,000×, 10,000×, 100,000× |
| **R** | Reset current scenario to initial state |
| **Mouse Left Drag** | Pan camera across the solar system |
| **Mouse Wheel** | Smooth zoom centered on cursor |

---

## 7. Project Architecture

```
orbital-playground/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Continuous Integration (lint, test, build)
│       └── deploy.yml                      # Automated GitHub Pages deployment
├── public/
│   └── assets/rockets/
│       └── saturn_v_n1_reference.png       # Blueprint visual reference
├── src/
│   ├── physics/
│   │   ├── Constants.ts                    # Real SI values (IAU, CODATA, NASA SP-4029)
│   │   ├── Vector2.ts                      # Double-precision 2D vector math
│   │   ├── CelestialBody.ts                # Astronomical bodies & rotational kinematics
│   │   ├── Atmosphere.ts                   # US Standard Atmosphere 1976 barometric model
│   │   ├── Aerodynamics.ts                 # Dynamic pressure (Max Q) & drag calculation
│   │   ├── Staging.ts                      # Multi-stage rocket & spent debris physics
│   │   ├── Spacecraft.ts                   # Saturn V flight vehicle & variable mass
│   │   ├── Integrator.ts                   # Symplectic Velocity Verlet, RK4, Euler
│   │   ├── Orbit.ts                        # Keplerian elements & conic trajectory generator
│   │   ├── PhysicsEngine.ts                # N-body simulation & substepping loop
│   │   └── __tests__/
│   │       ├── PhysicsEngine.test.ts       # 11 automated real-scale physics tests
│   │       └── Orbit.test.ts               # Real-scale orbital math tests
│   ├── rendering/
│   │   ├── Camera.ts                       # Floating origin camera-relative rendering
│   │   ├── PlanetRenderer.ts               # 3-tier LOD spherical Earth/Moon renderer
│   │   ├── RocketRenderer.ts               # Vector Saturn V blueprint drawing & plumes
│   │   └── SimulationRenderer.ts           # Canvas pipeline & orbit visualizer
│   ├── simulation/
│   │   └── Scenario.ts                     # Mission scenarios & objective checks
│   ├── components/
│   │   ├── simulation/
│   │   │   ├── SimulationCanvas.tsx        # High-DPI canvas & event loop
│   │   │   └── Starfield.ts                # Parallax deep-space starfield
│   │   └── panels/
│   │       ├── FlightComputer.tsx          # Real-time aerospace HUD (altitude, speed, Max Q)
│   │       ├── StageControl.tsx            # SFS-style staging sequence panel
│   │       ├── MissionPanel.tsx            # Objective status & scenario switcher
│   │       ├── SimulationControls.tsx      # Time warp (up to 100,000x), Pause, Reset
│   │       ├── CameraControls.tsx          # Camera targeting & zoom
│   │       ├── VehicleViewerModal.tsx      # Blueprint modal with reference image
│   │       ├── PhysicsGuideModal.tsx       # Educational theory & formulas modal
│   │       └── KeyboardHelp.tsx            # Flight controls cheatsheet
│   ├── utils/
│   │   └── formatters.ts                   # Aerospace units formatters
│   ├── App.tsx                             # Top-level application layout
│   ├── main.tsx                            # React DOM mount
│   └── index.css                           # Tailwind CSS setup
├── CREDITS.md                              # Attribution & NASA documentation sources
├── LICENSE                                 # MIT License
└── vite.config.ts                          # Vite & GitHub Pages base configuration
```

---

## 8. Running Locally

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

## 9. Automated Testing & Verification

Run the full automated test suite:
```bash
npm run test
```

### Verified Properties:
1. **Gravitational Falloff**: Gravitational acceleration decreases strictly with $1/r^2$.
2. **Zero-Thrust Invariance**: No artificial acceleration occurs without engine thrust.
3. **Gravitational Symmetry**: Equal masses cancel at equilibrium points.
4. **Thrust & Mass Scaling**: $a = F / m$ scales linearly with throttle and inversely with vehicle mass.
5. **Propellant Depletion**: Fuel mass consumption increases rocket acceleration over time.
6. **Atmospheric Density**: Barometric exponential decay matches scale height ($H = 8.5\text{ km}$); drag scales with $v^2$.
7. **Physical Staging**: Stage separation drops stage mass, advances active engine, and creates independent physical debris.
8. **Orbital Energy Conservation**: Specific energy remains conserved within $0.01\%$ over long-duration Velocity Verlet orbits.
9. **Real Earth-Moon Scale**: Moon semi-major axis is $384,400\text{ km}$, orbital speed is $\sim 1,018\text{ m/s}$, and surface gravity is $1.62\text{ m/s}^2$.
10. **RK4 Numerical Stability**: 4th-order Runge-Kutta integrator stably integrates orbital paths.
11. **Liftoff Threshold**: Rocket remains locked on Pad 39A until S-IC thrust exceeds total vehicle weight ($F_{thrust} > m \cdot g$).

---

## 10. Limitations & Future Plans

* **2D Orbital Plane**: Current implementation models the Earth-Moon system in a 2D orbital plane. Future updates can expand to full 3D orbital inclination and nodal precession.
* **Atmospheric Reentry Heating**: Future versions can model aerodynamic heating and shock compression during high-speed Earth reentry.
* **Hohmann Maneuver Planner**: Interactive $\Delta v$ planning nodes on the predicted trajectory line.

---

## 11. Credits & Attribution

See [CREDITS.md](CREDITS.md) for full documentation citations, including NASA SP-4029, NASA SP-4206, and public-domain IAU / JPL Horizons astronomical datasets.

---

## 12. License

MIT License. See [LICENSE](LICENSE) for details.
