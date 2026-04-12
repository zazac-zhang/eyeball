import { useMemo } from 'react';
import * as THREE from 'three';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { useCollisionDetection } from '../../hooks/useCollisionDetection';
import { useSimulationStore } from '../../stores/simulationStore';

interface CurvedNeedleTipProps {
  position: [number, number, number];
}

/**
 * Maps a force value (0-1) to a color gradient from silver to deep red.
 *
 * - 0.0: silver (no force, free space)
 * - 0.3: light pink (light contact)
 * - 0.6: orange-red (moderate force)
 * - 1.0: deep red (high force / max insertion + tilt)
 */
function forceToColor(force: number): THREE.Color {
  const r = Math.min(1, 0.75 + force * 0.25);
  const g = Math.max(0, 0.75 - force * 0.75);
  const b = Math.max(0, 0.75 - force * 0.65);
  return new THREE.Color(r, g, b);
}

/**
 * Curved surgical needle tip with force feedback visualization.
 *
 * Color encodes simulated insertion force:
 * - silver = low force (shallow / low tilt)
 * - pink/orange = moderate force
 * - deep red = high force (deep insertion / high tilt)
 *
 * Additionally glows when colliding with eyeball surface.
 */
export function CurvedNeedleTip({ position }: CurvedNeedleTipProps) {
  const { isColliding } = useCollisionDetection();
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);

  // Simulated force: combination of insertion depth ratio and tilt angle ratio
  const force = useMemo(() => {
    const depthRatio = insertionDepth / MAX_INSERTION_DEPTH;
    const tiltRatio = Math.abs(tiltAlpha) / MAX_TILT_ANGLE;
    // Weight: 60% depth, 40% tilt
    return Math.min(1, depthRatio * 0.6 + tiltRatio * 0.4);
  }, [insertionDepth, tiltAlpha]);

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

    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.15, 12, false);

    // Manually taper the radius along the tube to create pointed tip
    const positions = tubeGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const curvePosition = i / (positions.count / 12);
      const taperFactor = 1 - curvePosition * 0.8;

      vertex.multiplyScalar(taperFactor);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    tubeGeometry.computeVertexNormals();

    return tubeGeometry;
  }, []);

  const tipColor = forceToColor(force);

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial
        color={tipColor}
        metalness={0.9}
        roughness={0.1}
        emissive={isColliding ? '#ff3300' : tipColor}
        emissiveIntensity={isColliding ? 0.5 : 0.1}
      />
    </mesh>
  );
}
