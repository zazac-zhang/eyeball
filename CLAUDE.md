# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**Use `pnpm` for all dependency operations.** Do not use `npm` or `yarn`.

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

### Directory Structure

```
src/
├── lib/                    # Math & kinematics
│   ├── rcm.ts              # RCM kinematics engine
│   ├── transforms.ts       # SE(3) homogeneous transforms
│   └── sphereIntersect.ts  # Ray-sphere intersection
├── types/index.ts          # Vec3, SurgicalPhase, NeedlePose, SimulationState
├── constants/index.ts      # Eyeball radius (12mm), colors, max depths
├── stores/simulationStore.ts  # Zustand global state
├── hooks/useTrajectory.ts  # Trajectory recording hook (useFrame loop)
├── components/
│   ├── scene/
│   │   ├── Scene.tsx       # Canvas container + lighting + OrbitControls
│   │   ├── Lighting.tsx    # Ambient + directional + spot + point lights
│   │   └── ScleraClickHandler.tsx  # Mouse/keyboard interaction handler
│   ├── eyeball/
│   │   ├── Eyeball.tsx     # Composition container
│   │   ├── Sclera.tsx      # Opaque white sphere (r=12mm)
│   │   ├── Cornea.tsx      # Transparent protruding cap (r=8mm, z_offset=6mm)
│   │   ├── Lens.tsx        # Biconvex lens via LatheGeometry
│   │   └── LimbusRing.tsx  # Torus ring at cornea-sclera junction
│   ├── needle/
│   │   ├── Needle.tsx      # Needle assembly (reads pose from store, applies matrix)
│   │   ├── NeedleShaft.tsx # Cylinder geometry
│   │   └── NeedleTip.tsx   # Cone geometry
│   ├── trajectory/
│   │   ├── TrajectoryLines.tsx  # Red trail line (drei Line)
│   │   └── RCMIndicator.tsx     # Green glowing sphere at RCM point
│   └── hud/
│       ├── KinematicsPanel.tsx  # Real-time readout (tip coords, angles, phase)
│       └── ControlPanel.tsx     # Sliders for tilt/depth, preset angles, reset
├── App.tsx                 # Canvas + HUD overlay
└── main.tsx               # Entry point
```

### Interaction

| Input | Action |
|-------|--------|
| Left click on eyeball | Place RCM point |
| Left drag (after RCM placed) | Tilt needle (alpha/beta) |
| Scroll wheel | Insert/withdraw depth |
| Right/Middle drag | Orbit camera |
| R | Reset simulation |
| C | Clear trails |
| Arrow Up/Down | Insert/withdraw 0.5mm |
| Arrow Left/Right | Rotate azimuth |
| 1-4 | Preset tilt angles (0°/15°/30°/45°) |

### Key Implementation Details

- **Needle transform**: The Needle component uses `matrixAutoUpdate={false}` and applies `pose.needleTransform` directly via `matrix.fromArray()`. The needle origin is at the RCM point, local z-axis = shaft direction. Shaft extends outside the eyeball (15mm visible portion) so it's always visible at d=0.
- **Eyeball geometry**: Sclera is a full opaque sphere. Cornea is a smaller-radius (8mm) transparent cap centered at z=6mm, protruding ~2mm past the sclera front. LimbusRing sits at the exact intersection of the two spheres.
- **Trail points**: Recorded every 50ms during manipulation, capped at 5000 points to prevent unbounded memory growth.
- **Tests**: Located in `src/lib/*.test.ts`, cover transforms and RCM kinematics.
