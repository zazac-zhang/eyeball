import * as THREE from 'three';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

export function Sclera() {
  return (
    <mesh>
      <sphereGeometry args={[EYEBALL_RADIUS, 64, 64]} />
      <meshPhysicalMaterial
        color={COLORS.sclera}
        roughness={0.3}
        metalness={0.0}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
        side={THREE.FrontSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
