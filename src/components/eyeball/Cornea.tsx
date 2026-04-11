import { useMemo } from 'react';
import * as THREE from 'three';
import { CORNEA_RADIUS, COLORS } from '../../constants';

export function Cornea() {
  const geometry = useMemo(() => {
    // Spherical cap on the front (positive z) side
    const geo = new THREE.SphereGeometry(
      CORNEA_RADIUS,
      64,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.35
    );
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.cornea}
        transparent
        opacity={0.25}
        roughness={0.05}
        metalness={0.0}
        clearcoat={1.0}
        clearcoatRoughness={0.05}
        side={THREE.DoubleSide}
        ior={1.376}
      />
    </mesh>
  );
}
