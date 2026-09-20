# Indian Idle City Tycoon (IIT-Game) 🇮🇳 🏙️

An authentic Indian city idle/tycoon game built with Three.js, WebGL, Web Audio, and an offline-first Android WebView wrapper.

---

## 🎮 Game Features

- **15 Expandable Plots**: Progressive plot unlocking system across 4 distinct city zones (Small Street, Market, Neighborhood, City Center).
- **Authentic Indian Businesses**:
  - ☕ **Chai Stall**: Iconic kettle, cutting glasses, stove & tea setups.
  - 🏪 **Kirana Store**: Shelves, grain bags, weighing scale & awning.
  - 🍛 **Dhaba**: Tandoor, charpai cots, thalis & highway vibe.
  - 💇 **Salon**: Traditional barber chair, mirror & rotating pole.
  - 📱 **Mobile Shop**: Recharge banner, glass display counter & accessory hooks.
- **Living City Dynamics**:
  - Animated traffic with Kaali-Peeli & auto-rickshaws, and scooters following road lanes.
  - Diverse Indian NPCs with Gandhi topis, turbans, and hair styles.
  - Customers visibly approaching shops, completing transactions, and spawning floating cash particles.
- **Deep Economy & Progression**:
  - Level 5 / 10 / 20 visual upgrade tiers for all buildings.
  - Business Specializations (e.g. Masala Chai, Fast Service, Premium CTC).
  - Employee Roles (Cashier, Cook, Helper, Technician, Cleaner).
  - Dynamic Customer Demand & Business Popularity ratings (0–100).
  - Multi-business synergies (Food Street, Street Vendor Row, Tech Hub).
  - Active tap bonus with cooldown safeguards.
  - 27 Permanent Missions & 21 Achievements.
  - Daily Objective Task Board & 7-Day Login Rewards.
- **Atmosphere & Audiovisuals**:
  - Dynamic Day/Night lighting cycle with streetlights illuminating at night.
  - Procedural Web Audio SFX (cash chimes, ambient city hum, vehicle horns, celebratory jingles).
  - Touch camera controls (pinch-to-zoom, pan, desktop drag/wheel).
- **Robust Offline-First Architecture**:
  - Zero external CDN or internet dependencies.
  - LocalStorage versioned save system with legacy migration (V1 to V2) and clock-rollback protection.
  - 314 automated integration QA tests (100% pass rate).

---

## 🛠️ Tech Stack

- **Graphics**: [Three.js](https://threejs.org/) (WebGL)
- **Audio**: Web Audio API (procedural synthesis)
- **Platform**: Android WebView Native Wrapper (Gradle + Android SDK 34)
- **Storage**: LocalStorage with schema versioning & migration
- **Testing**: Node.js Automated QA Suite (`test-qa.js`)

---

## 🚀 Getting Started

### Run in Browser
Simply serve the root directory with any static HTTP server:
```bash
npx serve .
# or
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Run QA Test Suite
```bash
node test-qa.js
```

### Build Android APK
Ensure Android SDK and Gradle are configured:
```bash
./build-apk.sh
```
The output APK will be generated in the `output/` directory.

---

## 📦 APK Release

Pre-built release APK is located in the `output/` folder:
- **`output/indian-idle-tycoon-v1.1.0.apk`**: Latest signed release with full Phase 2 gameplay systems.
