# PRD: Eyeball Model Visual Quality Upgrade

## Problem Statement

The eyeball model in the RCM simulator looks fake and plasticky. As an ophthalmology resident using this tool to build surgical intuition, the low-quality materials and textures break immersion and undermine confidence in the simulation. The sclera blood vessels are obvious sine-wave patterns instead of realistic branching networks, the iris is a plain blue ring with no fiber detail, the cornea looks like a plastic film rather than a moist transparent tissue, and all surfaces lack the soft subsurface scattering that makes organic tissue look alive.

## Solution

Upgrade the eyeball model to **medical illustration quality** — the visual level of Netter anatomy plates or textbook illustrations. This means:

1. Correct PBR material parameters with subsurface scattering simulation across all tissue surfaces
2. Studio HDRI environment lighting for professional, even illumination
3. Improved procedural textures: recursive branching blood vessels on the sclera, radial fiber patterns on the iris
4. Proper cornea refraction and moist-surface appearance

The upgrade follows a phased approach — material foundation first, then per-component texture improvements — so each phase can be evaluated independently.

## User Stories

### Material Foundation

1. As a resident, I want the eyeball surface to have soft subsurface scattering, so that it looks like real organic tissue rather than plastic or ceramic
2. As a resident, I want the lighting to be even and professional (studio HDRI), so that material properties are visible from all camera angles
3. As a resident, I want the cornea to refract light realistically, so that it looks like a moist transparent tissue dome rather than a flat plastic film
4. As a resident, I want the sclera to have warm, organic tones with subtle color variation, so that it doesn't look like a uniformly white sphere
5. As a resident, I want the iris to have depth and translucency, so that it looks like a real colored tissue structure

### Sclera & Blood Vessels

6. As a resident, I want to see realistic branching blood vessels on the sclera surface, so that the eyeball looks anatomically accurate
7. As a resident, I want the blood vessels to be denser near the limbus and sparser toward the posterior, so that the vascular pattern matches real anatomy
8. As a resident, I want the vessels to have varying thickness and color (arteries vs veins), so that the pattern looks natural rather than uniform
9. As a resident, I want the vessel texture to wrap seamlessly around the sphere, so that there are no visible seams or tiling artifacts

### Iris & Pupil

10. As a resident, I want the iris to have radial fiber patterns, so that it looks like real iris tissue with crypts and folds
11. As a resident, I want the iris color to vary from the pupil edge to the limbus border (central heterochromia), so that it matches the natural color gradient seen in real eyes
12. As a resident, I want the pupil to still dynamically respond to insertion depth, so that the surgical response animation is preserved
13. As a resident, I want the iris to have some translucency, so that light appears to pass through the thinner parts of the iris

### Cornea

14. As a resident, I want the cornea to have a visible wet/glossy surface, so that it looks like a moist tissue rather than dry glass
15. As a resident, I want the cornea to properly refract the iris underneath, so that the iris appears slightly distorted through the corneal dome (as in real anatomy)
16. As a resident, I want the cornea-sclera transition (limbus) to be smooth and gradual, so that there's no hard edge between the two tissues

### Overall

17. As a resident, I want the overall eyeball to look like a medical illustration, so that it feels professional and trustworthy as a teaching tool
18. As a resident, I want the visual improvements to not degrade rendering performance below 60fps, so that the simulation remains smooth and interactive
19. As a developer, I want the texture generation to remain code-based (no external image files), so that the project stays zero-dependency for assets

## Implementation Decisions

### Phase Order

The upgrade is split into four phases, executed sequentially:

1. **Phase 1 — Material Foundation**: Upgrade all tissue materials to use `meshPhysicalMaterial` with `transmission`, `thickness`, and `attenuationColor` for subsurface scattering simulation. Add `<Environment preset="studio" />` from `@react-three/drei` for proper PBR environment lighting. This creates the correct base for all subsequent texture work.

2. **Phase 2 — Sclera Blood Vessels**: Replace the current sine-wave canvas texture with a recursive branching algorithm that generates anatomically plausible vascular networks. Vessels branch from major trunks near the limbus into capillaries toward the posterior. Vary thickness, opacity, and color (arterial red vs venous dark red) across branch orders.

3. **Phase 3 — Iris & Pupil**: Replace the plain `RingGeometry` + flat color with a procedurally generated iris texture featuring radial fiber patterns, crypts (dark spots between fibers), and a central-to-peripheral color gradient. Preserve the dynamic pupil scaling behavior tied to insertion depth.

4. **Phase 4 — Cornea Quality**: Fine-tune cornea material parameters — increase clearcoat, adjust transmission/thickness for proper refraction of the iris underneath, add a subtle specular highlight for the "wet" look. Smooth the limbus transition zone.

### Material Approach

- Use `meshPhysicalMaterial` (not custom shaders) for all tissue surfaces. The `transmission`/`thickness`/`attenuationColor` properties provide sufficient SSS simulation for medical illustration quality without the complexity of custom shader code.
- Each tissue type gets distinct material parameters:
  - **Sclera**: low transmission (~0.1), warm attenuation color, moderate roughness
  - **Cornea**: high transmission (~0.9), low roughness, high clearcoat, IOR 1.376
  - **Iris**: medium transmission (~0.2), fibrous texture, moderate roughness
  - **Limbus**: gradient transition between sclera and cornea parameters

### Environment Lighting

- Add `<Environment preset="studio" />` from `@react-three/drei`. This provides a neutral, professional HDRI environment map that all PBR materials use for reflections and refractions.
- Keep existing lights as fill/adjustment on top of the environment map, but reduce ambient light intensity since the environment map provides base illumination.

### Texture Generation

- All textures remain code-generated (Canvas 2D API) — no external image files.
- Sclera vessels: recursive branching algorithm — start with 3-5 major trunks near the limbus equator, each branches 4-6 times with decreasing radius and increasing randomness. Render as anti-aliased lines on a warm-white canvas.
- Iris fibers: radial noise algorithm — generate radial lines with Perlin-like noise displacement, overlay with random crypts (dark spots), apply a color gradient from center (darker) to periphery (lighter). Render onto a circular canvas mapped to the iris ring geometry.

### Existing Seams

- The component structure (`Sclera.tsx`, `Cornea.tsx`, `Eyeball.tsx`, etc.) is preserved — no new components needed.
- The `useMemo` pattern for geometry/texture creation is preserved (acceptable per project rules for expensive Three.js resources).
- The dynamic pupil scaling in `Iris` (driven by `insertionDepth` via `useFrame`) is preserved.
- The `BloodSimulation` and `TissueDeformation` components are untouched in this PRD.
- The post-processing pipeline (Bloom, SSAO, DoF) is preserved but may need parameter tuning after material changes.

## Testing Decisions

- **Visual regression**: Since this is a visual quality upgrade, the primary test is "does it look better." No automated visual regression tests are needed for this phase — manual inspection is sufficient.
- **Performance**: Verify that frame rate stays above 60fps after each phase. The procedural texture generation runs once (in `useMemo`), so it should not affect per-frame performance.
- **Existing tests**: The existing unit tests (`rcm.test.ts`, `transforms.test.ts`, `sphereIntersect.test.ts`, `simulationStore.test.ts`) are unaffected — they test kinematics and state, not rendering.
- **Build check**: Run `tsc -b && vite build` after each phase to verify no type or build errors.

## Out of Scope

- **Photorealistic rendering** — the target is medical illustration quality, not photorealism. Custom shaders, ray-traced reflections, and GPU-heavy SSS are out of scope.
- **Geometry changes** — the sphere/cap/ring geometry is correct. Only materials and textures change.
- **BloodSimulation improvements** — the particle-based blood effect may need improvement but is separate from this PRD.
- **TissueDeformation improvements** — the current ring-based deformation indicator may need to become actual mesh deformation, but that's a separate effort.
- **Needle model upgrade** — the needle visual quality is not addressed here.
- **External texture assets** — all textures remain code-generated.
- **Mobile/touch visual quality** — no device-specific visual optimizations.

## Further Notes

- The `@react-three/drei` dependency is already in `package.json`, so `<Environment>` requires no new dependency.
- If the recursive branching vessel algorithm produces unsatisfactory results, the fallback is to accept hand-drawn texture images as assets (the hybrid approach discussed during planning).
- Post-processing parameters (Bloom intensity, SSAO radius, DoF focus distance) may need re-tuning after material changes since the new SSS materials interact differently with the effect pipeline.
