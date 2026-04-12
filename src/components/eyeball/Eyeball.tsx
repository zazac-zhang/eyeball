import { Sclera, EyeInterior, Retina } from './Sclera';
import { Cornea, Iris, LimbusRing } from './Cornea';
import { TissueDeformation } from './TissueDeformation';
import { BloodSimulation } from './BloodSimulation';

/**
 * Eyeball assembly — rendered in correct z-order (back to front):
 *
 * 1. Sclera (opaque white outer shell)
 * 2. Retina (semi-transparent inner layer)
 * 3. EyeInterior (dark inner sphere, BackSide — backdrop for front features)
 * 4. Iris + Pupil (colored ring at front, inside the eye)
 * 5. Cornea (transparent dome covering the front)
 * 6. LimbusRing (decorative ring at cornea-sclera boundary)
 * 7. TissueDeformation (indentation indicator at RCM point)
 * 8. BloodSimulation (particle-based bleeding effect)
 */
export function Eyeball() {
  return (
    <group position={[0, 0, 0]}>
      <Sclera />
      <Retina />
      <EyeInterior />
      <Iris />
      <Cornea />
      <LimbusRing />
      <TissueDeformation />
      <BloodSimulation />
    </group>
  );
}
