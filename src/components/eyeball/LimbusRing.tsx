import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

// Must match the cornea parameters
const CORNEA_CENTER_Z = 6;
const CORNEA_RADIUS_CURVATURE = 8;

// Junction where cornea meets sclera
const intersectionZ = (EYEBALL_RADIUS * EYEBALL_RADIUS - CORNEA_CENTER_Z * CORNEA_CENTER_Z + CORNEA_RADIUS_CURVATURE * CORNEA_RADIUS_CURVATURE) / (2 * CORNEA_CENTER_Z);
const junctionRadius = Math.sqrt(EYEBALL_RADIUS * EYEBALL_RADIUS - intersectionZ * intersectionZ);

export function LimbusRing() {
  const geometry = useMemo(() => {
    // Torus ring at the cornea-sclera boundary
    // The ring lies in the XY plane at z = intersectionZ, with radius = junctionRadius
    const tubeRadius = 0.2;
    const geo = new THREE.TorusGeometry(junctionRadius, tubeRadius, 16, 64);
    // Torus is created in XY plane, centered at origin
    // Translate to the junction z position
    geo.translate(0, 0, intersectionZ);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.limbus}
        emissive={COLORS.limbus}
        emissiveIntensity={0.4}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}
