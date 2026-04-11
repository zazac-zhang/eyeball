import { Sclera } from './Sclera';
import { Cornea } from './Cornea';
import { Lens } from './Lens';
import { LimbusRing } from './LimbusRing';

export function Eyeball() {
  return (
    <group position={[0, 0, 0]}>
      <Sclera />
      <Cornea />
      <Lens />
      <LimbusRing />
    </group>
  );
}
