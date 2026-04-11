import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

export function Sclera() {
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(EYEBALL_RADIUS, 64, 64);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.sclera}
        roughness={0.3}
        metalness={0.0}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export function EyeInterior() {
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(EYEBALL_RADIUS - 0.5, 48, 48);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.interior}
        roughness={0.95}
        metalness={0.0}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
