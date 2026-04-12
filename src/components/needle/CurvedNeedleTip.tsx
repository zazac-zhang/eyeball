import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';
import { useCollisionDetection } from '../../hooks/useCollisionDetection';

interface CurvedNeedleTipProps {
  position: [number, number, number];
}

/**
 * Curved surgical needle tip — more realistic than straight cone.
 *
 * Uses a CatmullRomCurve3 to create a smooth 180° curve with a tapered
 * diameter (thick at shaft connection, thin at tip). Real surgical needles
 * are typically curved needles (1/2 circle, 3/8 circle, etc.).
 *
 * Glows when colliding with eyeball surface.
 */
export function CurvedNeedleTip({ position }: CurvedNeedleTipProps) {
  const { isColliding } = useCollisionDetection();

  const geometry = useMemo(() => {
    // Create a curved path (180° semi-circle)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), // Start (connection to shaft)
      new THREE.Vector3(0, 0.5, 0.4), // Control point 1
      new THREE.Vector3(0, 1.0, 0.7), // Control point 2
      new THREE.Vector3(0, 1.5, 0.85), // Control point 3
      new THREE.Vector3(0, 2.0, 0.9), // Control point 4
      new THREE.Vector3(0, 2.5, 0.85), // Control point 5
      new THREE.Vector3(0, 3.0, 0.7), // Control point 6 (tip)
    ]);

    // Create tubular geometry along the curve
    // tubularSegments: 64 for smooth curve
    // radius: starts at 0.15 (matching shaft), tapers to 0.03 at tip
    // radialSegments: 12 for circular cross-section
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.15, 12, false);

    // Manually taper the radius along the tube to create pointed tip
    const positions = tubeGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      // Calculate normalized position along curve (0 to 1)
      const curvePosition = i / (positions.count / 12); // Approximate
      const taperFactor = 1 - curvePosition * 0.8; // Taper to 20% at tip

      vertex.multiplyScalar(taperFactor);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    tubeGeometry.computeVertexNormals();

    return tubeGeometry;
  }, []);

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial
        color={isColliding ? '#ff6600' : COLORS.needleTip}
        metalness={0.9}
        roughness={0.1}
        emissive={isColliding ? '#ff3300' : COLORS.needleTip}
        emissiveIntensity={isColliding ? 0.5 : 0.1}
      />
    </mesh>
  );
}
