# Credits & Reference Documentation

**Orbital Playground** is an educational, browser-based spaceflight and orbital mechanics simulator designed with real SI physical parameters.

---

## 1. Historical Vehicle References & Blueprints

### Saturn V / Apollo Launch Vehicle
* **Visual Reference Source**: Historical technical blueprint elevation of the Saturn V Apollo stack and Soviet N1-L3 launch vehicles, derived from NASA and aerospace historical documentation (public domain / educational research).
* **Reference Specifications**:
  * NASA SP-4029: *Apollo By The Numbers: A Statistical Reference* (Richard W. Orloff).
  * NASA Marshall Space Flight Center: *Saturn V Flight Manual (SA 503 / SA 507)*.
  * NASA SP-4206: *Stages to Saturn: A Technological History of the Apollo/Saturn Launch Vehicles* (Roger E. Bilstein).
* **Stage & Engine Parameters**:
  * **S-IC First Stage**: 5 $\times$ Rocketdyne F-1 engines (RP-1 / LOX). Sea-level thrust: $35.1\text{ MN}$, vacuum thrust: $38.7\text{ MN}$, $I_{sp} = 263\text{ s}$ (SL) to $304\text{ s}$ (vac). Stage dry mass: $\sim 131,000\text{ kg}$, propellant mass: $\sim 2,160,000\text{ kg}$.
  * **S-II Second Stage**: 5 $\times$ Rocketdyne J-2 engines (LH2 / LOX). Vacuum thrust: $5.14\text{ MN}$, $I_{sp} = 421\text{ s}$. Stage dry mass: $\sim 40,000\text{ kg}$, propellant mass: $\sim 450,000\text{ kg}$.
  * **S-IVB Third Stage**: 1 $\times$ Rocketdyne J-2 engine (LH2 / LOX). Vacuum thrust: $1.0\text{ MN}$, $I_{sp} = 421\text{ s}$. Stage dry mass: $\sim 13,500\text{ kg}$, propellant mass: $\sim 106,000\text{ kg}$.
  * **Apollo Command/Service Module (CSM) & Lunar Module (LM)**: Aerojet AJ10-137 SPS engine ($91\text{ kN}$, $I_{sp} = 314\text{ s}$) and Lunar Descent Engine ($45\text{ kN}$ throttleable, $I_{sp} = 311\text{ s}$).
* **Disclaimer**: This simulator is an independent, original educational simulation. It is NOT officially affiliated with, endorsed by, or sponsored by NASA or any governmental aerospace organization.

---

## 2. Astronomical & Planetary Constants

All values are based on authoritative scientific institutions and datasets:
* **International Astronomical Union (IAU) & NASA JPL Horizons Ephemerides**:
  * Gravitational Constant $G = 6.67430 \times 10^{-11}\text{ m}^3/(\text{kg}\cdot\text{s}^2)$ (CODATA 2018).
  * **Earth**:
    * Mean volumetric radius: $R_E = 6,371,000\text{ m}$ ($6,371\text{ km}$).
    * Standard gravitational parameter: $\mu_E = 3.986004418 \times 10^{14}\text{ m}^3/\text{s}^2$.
    * Mass: $M_E = 5.9722 \times 10^{24}\text{ kg}$.
    * Standard surface gravity: $g_0 = 9.80665\text{ m/s}^2$.
    * Sidereal rotation period: $86,164.1\text{ s}$ ($\sim 23.9344\text{ hours}$), equatorial surface velocity $\approx 465.1\text{ m/s}$.
  * **Moon**:
    * Mean radius: $R_M = 1,737,400\text{ m}$ ($1,737.4\text{ km}$).
    * Standard gravitational parameter: $\mu_M = 4.9048695 \times 10^{12}\text{ m}^3/\text{s}^2$.
    * Mass: $M_M = 7.342 \times 10^{22}\text{ kg}$.
    * Surface gravity: $g_{Moon} \approx 1.62\text{ m/s}^2$.
    * Semi-major axis around Earth: $384,400,000\text{ m}$ ($384,400\text{ km}$).
    * Orbital velocity around Earth: $\approx 1,022\text{ m/s}$.
  * **Sun**:
    * Volumetric radius: $R_S = 6.9634 \times 10^8\text{ m}$.
    * Standard gravitational parameter: $\mu_S = 1.32712440018 \times 10^{20}\text{ m}^3/\text{s}^2$.
    * Mass: $M_S = 1.9885 \times 10^{30}\text{ kg}$.
* **Atmospheric Model**:
  * Standard barometric exponential profile based on the **U.S. Standard Atmosphere (1976)**:
    $\rho(h) = \rho_0 \exp(-h / H)$ with sea-level density $\rho_0 = 1.225\text{ kg/m}^3$ and effective scale height $H \approx 8,500\text{ m}$.

---

## 3. NASA Media Usage Guidelines Notice

NASA imagery and data used for educational and informational purposes conform to the [NASA Media Usage Guidelines](https://www.nasa.gov/multimedia/guidelines/index.html). NASA material is not protected by copyright unless specifically noted. NASA logos, insignias, and identifiers are strictly excluded from all branding.
