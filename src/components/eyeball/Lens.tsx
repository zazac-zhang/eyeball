import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';

export function Lens() {
  const geometry = useMemo(() => {
    // Biconvex lens shape via LatheGeometry
    const points = [
      new THREE.Vector2(0, 3),
      new THREE.Vector2(3.5, 2.5),
      new THREE.Vector2(4.2, 0),
      new THREE.Vector2(3.5, -2.5),
      new THREE.Vector2(0, -3),
    ];
    return new THREE.LatheGeometry(points, 32);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 0, 6]}>
      <meshPhysicalMaterial
        color={COLORS.lens}
        transparent
        opacity={0.4}
        roughness={0.1}
        metalness={0.0}
        ior={1.42}
      />
    </mesh>
  );
}
