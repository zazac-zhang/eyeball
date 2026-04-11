import { Sclera, EyeInterior } from './Sclera';
import { Cornea, Iris, LimbusRing } from './Cornea';

/**
 * Eyeball assembly — rendered in correct z-order (back to front):
 *
 * 1. Sclera (opaque white outer shell)
 * 2. EyeInterior (dark inner sphere, BackSide — backdrop for front features)
 * 3. Iris + Pupil (colored ring at front, inside the eye)
 * 4. Cornea (transparent dome covering the front)
 * 5. LimbusRing (decorative ring at cornea-sclera boundary)
 *
 * The key insight: since all components are separate meshes (not overlapping
 * in the depth buffer except where intended), the transparent cornea renders
 * on top and the iris/pupil show through it.
 */
export function Eyeball() {
  return (
    <group position={[0, 0, 0]}>
      <Sclera />
      <EyeInterior />
      <Iris />
      <Cornea />
      <LimbusRing />
    </group>
  );
}
