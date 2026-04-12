# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**Use `bun` for all dependency operations.** Do not use `npm` or `yarn`.

## Commands

```bash
pnpm dev          # Start dev server (Vite)
pnpm build        # Type check + production build
pnpm test         # Run unit tests (vitest)
pnpm preview      # Preview production build
pnpm lint         # ESLint
```

## Architecture

Eyeball Surgery Robot RCM (Remote Center of Motion) Simulator — a 3D interactive simulation showing a surgical needle constrained by an RCM point on an eyeball surface.

**Stack**: Vite + React 19 + TypeScript + R3F (React Three Fiber) + Zustand

### RCM Kinematics Model

The core constraint: the needle shaft always passes through the RCM point (the point where the needle tip first contacts the eyeball surface).

- **alpha** (tiltAlpha): elevation angle from surface normal (0 = straight in)
- **beta** (tiltBeta): azimuth angle around the surface normal
- **d** (insertionDepth): distance along the needle axis from RCM point

See `src/lib/rcm.ts` for `computeNeedlePose()` and `computeRCMFromRay()`.

### State Management

`src/stores/simulationStore.ts` (Zustand) — single source of truth for RCM point, needle pose, surgical phase, and trajectory.

**Surgical Phase Machine**: `IDLE → CONTACT → INSERTING → WITHDRAWING → COMPLETE`

- `CONTACT`: RCM point placed on eyeball surface
- `INSERTING`: user manipulates needle (tilt or depth > 0)
- `WITHDRAWING`: depth was > 0 then returned to 0 once
- `COMPLETE`: depth = 0 after WITHDRAWING

### React Compiler

**This project uses React Compiler (`babel-plugin-react-compiler`) for automatic memoization.** Do NOT use `useCallback`, `useMemo`, or `React.memo` — the compiler handles all optimization automatically. Write plain functions and let the compiler decide what to memoize.

**Exception**: `useMemo` for expensive Three.js geometry/material creation (e.g., `TubeGeometry`, `LatheGeometry`) is acceptable when the computation is genuinely expensive and should only run once. In these cases, the `useMemo` acts as an explicit signal, not a premature optimization.

### Directory Structure

```
src/
├── lib/                    # Math & kinematics
│   ├── rcm.ts              # RCM kinematics engine
│   ├── transforms.ts       # SE(3) homogeneous transforms
│   ├── sphereIntersect.ts  # Ray-sphere intersection
│   ├── utils.ts            # cn() utility for Tailwind class merging
│   └── export.ts           # Trail JSON import/export + screen recorder
├── types/index.ts          # Vec3, SurgicalPhase, NeedlePose, SimulationState
├── constants/index.ts      # Eyeball radius (12mm), colors, max depths
├── stores/
│   ├── simulationStore.ts  # Zustand global state (undo/redo, multi-RCM)
│   ├── keyBindingsStore.ts # Keyboard binding customization
│   └── themeStore.ts       # Dark/light theme
├── hooks/
│   ├── useMouseControl.ts      # Mouse interaction (click, drag, scroll)
│   ├── useTouchPinch.ts        # Mobile pinch-to-zoom for depth
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   ├── useTrajectory.ts        # Trajectory recording (useFrame loop)
│   ├── useActionLogger.ts      # Action logging with console + JSON export
│   ├── useCollisionDetection.ts# Needle-eyeball collision detection
│   ├── usePhaseTransition.ts   # Phase change flash + sound effects
│   ├── useAutoPhaseTransition.ts# Auto phase transitions based on depth
│   ├── useChartDataCollector.ts# Real-time chart data collection
│   └── useBreakpoint.ts        # Responsive breakpoint detection
├── components/
│   ├── scene/
│   │   ├── Scene.tsx       # Canvas container + post-processing + controls
│   │   ├── Lighting.tsx    # Ambient + directional + spot + point lights
│   │   └── ScleraClickHandler.tsx  # Mouse/keyboard interaction handler
│   ├── eyeball/
│   │   ├── Eyeball.tsx     # Composition container
│   │   ├── Sclera.tsx      # Opaque white sphere (r=12mm)
│   │   ├── Cornea.tsx      # Transparent protruding cap (r=8mm, z_offset=6mm)
│   │   ├── Lens.tsx        # Biconvex lens via LatheGeometry
│   │   ├── LimbusRing.tsx  # Torus ring at cornea-sclera junction
│   │   ├── BloodSimulation.tsx     # Particle-based blood effect
│   │   └── TissueDeformation.tsx   # Puncture site indentation
│   ├── needle/
│   │   ├── Needle.tsx          # Needle assembly (matrix transform from store)
│   │   ├── NeedleShaft.tsx     # Cylinder geometry
│   │   ├── CurvedNeedleTip.tsx # TubeGeometry curved tip + force feedback color
│   │   ├── NeedleHolder.tsx    # Robotic gripper visualization
│   │   └── DepthRuler.tsx      # Graduated depth scale
│   ├── trajectory/
│   │   ├── TrajectoryLines.tsx     # Time-gradient trail (blue→red)
│   │   ├── RCMIndicator.tsx        # Green glowing sphere at RCM
│   │   ├── RCMConstraintLine.tsx   # Dashed RCM-to-tip constraint line
│   │   ├── NormalIndicator.tsx     # Surface normal arrow
│   │   ├── SafetyCone.tsx          # Max tilt angle cone visualization
│   │   ├── CollisionIndicator.tsx  # Collision highlight ring
│   │   ├── ObjectLabels.tsx        # 3D object name labels
│   │   └── Annotations3D.tsx       # 3D HTML annotations (RCM coords, depth, normal)
│   ├── hud/
│   │   ├── KinematicsPanel.tsx  # Real-time readout (tip coords, angles, phase)
│   │   ├── ControlPanel.tsx     # shadcn/ui sliders, buttons, tooltips
│   │   ├── ModePanel.tsx        # VIEW/PLACE/EDIT/REPLAY mode switcher
│   │   ├── SettingsPanel.tsx    # Theme, opacity, lighting, key bindings
│   │   ├── RCMPointList.tsx     # Multi-RCM point management UI
│   │   ├── MiniMap.tsx          # 2D top-down spatial view
│   │   ├── RealTimeChart.tsx    # Depth-over-time chart (Recharts)
│   │   └── ResponsiveHUD.tsx    # Responsive HUD layout
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── badge.tsx
│       ├── slider.tsx
│       └── tooltip.tsx
├── App.tsx                 # Canvas + HUD overlay
└── main.tsx               # Entry point
```

### Interaction

| Input                        | Action                              |
| ---------------------------- | ----------------------------------- |
| Left click on eyeball        | Place RCM point                     |
| Left drag (after RCM placed) | Tilt needle (alpha/beta)            |
| Scroll wheel                 | Insert/withdraw depth               |
| Right/Middle drag            | Orbit camera                        |
| V/P/E/R                      | Switch mode (View/Place/Edit/Replay)|
| Arrow Up/Down                | Insert/withdraw 0.5mm               |
| Arrow Left/Right             | Rotate azimuth                      |
| 1-4                          | Preset tilt angles (0°/15°/30°/45°) |
| Ctrl+Z / Ctrl+Shift+Z        | Undo / Redo                         |
| Esc                          | Reset simulation                    |
| C                            | Clear trails                        |

### Key Implementation Details

- **Needle transform**: The Needle component uses `matrixAutoUpdate={false}` and applies `pose.needleTransform` directly via `matrix.fromArray()`. The needle origin is at the RCM point, local z-axis = shaft direction. Shaft extends outside the eyeball (15mm visible portion) so it's always visible at d=0.
- **Eyeball geometry**: Sclera is a full opaque sphere. Cornea is a smaller-radius (8mm) transparent cap centered at z=6mm, protruding ~2mm past the sclera front. LimbusRing sits at the exact intersection of the two spheres.
- **Trail points**: Recorded every 50ms during manipulation, capped at 5000 points to prevent unbounded memory growth.
- **Force feedback visualization**: Needle tip color encodes simulated insertion force (silver → pink → orange → red) based on depth (60%) + tilt (40%).
- **Tests**: Located in `src/lib/*.test.ts`, cover transforms and RCM kinematics.
