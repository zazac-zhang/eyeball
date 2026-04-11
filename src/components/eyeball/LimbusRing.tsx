import { useMemo } from 'react';
import * as THREE from 'three';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

export function LimbusRing() {
  const geometry = useMemo(() => {
    // Torus ring at the cornea-sclera boundary
    const radius = EYEBALL_RADIUS * Math.sin(Math.PI * 0.35);
    const tubeRadius = 0.15;
    const geo = new THREE.TorusGeometry(radius, tubeRadius, 16, 64);
    // Rotate to lie on the cornea boundary plane
    geo.rotateX(Math.PI * 0.35);
    // Position at the cornea edge
    const zOffset = EYEBALL_RADIUS * Math.cos(Math.PI * 0.35);
    geo.translate(0, 0, zOffset);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.limbus}
        emissive={COLORS.limbus}
        emissiveIntensity={0.3}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}
