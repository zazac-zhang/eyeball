import { Sclera } from './Sclera';
import { Cornea } from './Cornea';
import { LimbusRing } from './LimbusRing';

export function Eyeball() {
  return (
    <group position={[0, 0, 0]}>
      <Sclera />
      <Cornea />
      <LimbusRing />
    </group>
  );
}
