import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

// Cornea: smaller radius, positioned to protrude ~2mm in front of eyeball
const CORNEA_RADIUS_CURVATURE = 8;
const CORNEA_CENTER_Z = 6; // center at z=6, front at z=14

// Compute the cap angle: where cornea sphere intersects eyeball sphere
// eyeball: x² + y² + z² = 144
// cornea: x² + y² + (z-6)² = 64
// => z = 9.67, circle radius = √(144 - 9.67²) ≈ 7.1mm
const intersectionZ = (EYEBALL_RADIUS * EYEBALL_RADIUS - CORNEA_CENTER_Z * CORNEA_CENTER_Z + CORNEA_RADIUS_CURVATURE * CORNEA_RADIUS_CURVATURE) / (2 * CORNEA_CENTER_Z);
const junctionRadius = Math.sqrt(EYEBALL_RADIUS * EYEBALL_RADIUS - intersectionZ * intersectionZ);
const CAP_ANGLE = Math.asin(junctionRadius / CORNEA_RADIUS_CURVATURE);

export function Cornea() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(
      CORNEA_RADIUS_CURVATURE,
      64,
      32,
      0,
      Math.PI * 2,    // full horizontal
      0,
      CAP_ANGLE       // cap from front pole to junction
    );
    // Rotate so the dome faces +Z (Three.js pole is +Y by default)
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 0, CORNEA_CENTER_Z]}>
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
