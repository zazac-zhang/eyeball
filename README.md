# Eyeball RCM Simulator

Eyeball surgery robot RCM (Remote Center of Motion) simulator — a 3D interactive simulation showing a surgical needle constrained by an RCM point on an eyeball surface.

![Screenshot](screenshots/simulator.png)

## Features

- **RCM-constrained needle kinematics** — the needle shaft always passes through the RCM point
- **Four simulation modes**: VIEW / PLACE / EDIT / REPLAY
- **Interactive 3D controls** — orbit camera, click-to-place RCM, drag-to-tilt, scroll-to-insert
- **Real-time kinematics display** — tip coordinates, angles, surgical phase
- **Trajectory recording & playback** — export/import JSON, replay with speed control
- **Screen recording & screenshots** — capture sessions for review
- **Customizable keyboard shortcuts** — remap any key in Settings
- **Surgical phase tracking** — IDLE → CONTACT → INSERTING → WITHDRAWING → COMPLETE
- **Multi-RCM management** — place, switch, and delete multiple RCM points
- **Real-time depth chart** — visualize insertion depth over time
- **2D minimap** — top-down XY projection of needle and RCM positions
- **Undo/redo** — full history stack for needle adjustments
- **Visual polish** — bloom, SSAO, depth of field, procedural sclera vessels, blood particles, tissue deformation

## Stack

| Layer        | Technology                        |
| ------------ | ---------------------------------- |
| Framework    | React 19 + TypeScript              |
| Build        | Vite 8                             |
| 3D Rendering | React Three Fiber + Three.js       |
| State        | Zustand                            |
| Styling      | Tailwind CSS v4                    |
| Charts       | Recharts                           |
| Testing      | Vitest + Playwright                |
| Package Mgr  | Bun                                |

## Quick Start

```bash
bun install
bun run dev
```

Open `http://localhost:5173` in your browser.

## Interaction

| Input                        | Action                              |
| ---------------------------- | ----------------------------------- |
| Left click on eyeball        | Place RCM point                     |
| Left drag (after RCM placed) | Tilt needle (alpha/beta)            |
| Scroll wheel                 | Insert/withdraw depth               |
| Right/Middle drag            | Orbit camera                        |
| V / P / E / R               | Switch modes                        |
| Arrow Up/Down                | Insert/withdraw 0.5mm               |
| Arrow Left/Right             | Rotate azimuth                      |
| 1-4                          | Preset tilt angles (0/15/30/45 deg) |
| Escape                       | Reset simulation                    |
| C                            | Clear trails                        |
| Ctrl+Z / Ctrl+Shift+Z        | Undo / Redo                         |

## Architecture

```
src/
├── lib/                     # Math & kinematics
│   ├── rcm.ts               # RCM kinematics engine
│   ├── transforms.ts        # SE(3) homogeneous transforms
│   └── sphereIntersect.ts   # Ray-sphere intersection
├── types/index.ts           # Vec3, SurgicalPhase, NeedlePose, SimulationState
├── constants/index.ts       # Eyeball radius (12mm), colors, max depths
├── stores/                  # Zustand stores
│   ├── simulationStore.ts   # Global state: RCM, needle, phase, trajectory
│   ├── keyBindingsStore.ts  # Customizable keyboard shortcuts
│   └── themeStore.ts        # Dark/light theme
├── hooks/                   # React hooks
│   ├── useTrajectory.ts     # Trajectory recording hook
│   ├── useKeyboardShortcuts.ts  # Mode-gated keyboard shortcuts
│   ├── useAutoPhaseTransition.ts  # Automatic phase transitions
│   ├── usePhaseTransition.ts      # Phase transition flash + sound
│   ├── useForceFeedback.ts        # Force visualization
│   ├── useTouchPinch.ts           # Mobile pinch-to-zoom
│   ├── useChartDataCollector.ts   # Depth chart data
│   └── useBreakpoint.ts           # Responsive breakpoint detection
├── components/
│   ├── scene/               # 3D scene assembly
│   ├── eyeball/             # Eyeball model (Sclera, Cornea, Retina, etc.)
│   ├── needle/              # Needle assembly
│   ├── trajectory/          # Visual indicators (lines, cones, normals)
│   └── hud/                 # HUD panels (Kinematics, Controls, Mode, etc.)
├── App.tsx                  # Canvas + HUD overlay
└── main.tsx                 # Entry point
```

## RCM Kinematics

The core constraint: the needle shaft always passes through the RCM point (the point where the needle tip first contacts the eyeball surface).

- **alpha** (tiltAlpha): elevation angle from surface normal (0 = straight in)
- **beta** (tiltBeta): azimuth angle around the surface normal
- **d** (insertionDepth): distance along the needle axis from RCM point

See `src/lib/rcm.ts` for `computeNeedlePose()` and `computeRCMFromRay()`.

## Scripts

```bash
bun run dev           # Start dev server
bun run build         # Type check + production build
bun run test          # Run unit tests (Vitest)
bun run test:e2e      # Run E2E tests (Playwright)
bun run lint          # ESLint
bun run format        # Prettier
bun run preview       # Preview production build
```

## CI/CD

Pushes to `master` trigger a GitHub Actions workflow:

1. Lint & type check
2. Unit tests with coverage
3. E2E tests with Playwright
4. Build and deploy to GitHub Pages

## License

MIT
