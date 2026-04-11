import * as THREE from 'three';
import { useMemo } from 'react';
import { COLORS } from '../../constants';
import { LIMBUS_Z, LIMBUS_RADIUS } from './Cornea';

export function LimbusRing() {
  const geometry = useMemo(() => {
    const tubeRadius = 0.2;
    const geo = new THREE.TorusGeometry(LIMBUS_RADIUS, tubeRadius, 16, 64);
    geo.translate(0, 0, LIMBUS_Z);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.limbus}
        emissive={COLORS.limbus}
        emissiveIntensity={0.3}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}
