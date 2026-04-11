import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

export function Sclera() {
  const geometry = useMemo(() => {
    // Complete sphere - opaque white base
    const geo = new THREE.SphereGeometry(EYEBALL_RADIUS, 64, 64);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.sclera}
        roughness={0.2}
        metalness={0.0}
        clearcoat={0.4}
        clearcoatRoughness={0.15}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
