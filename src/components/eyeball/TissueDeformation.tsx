import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

/**
 * TissueDeformation: visual indicator showing tissue indentation
 * when the needle is inserted. The deformation scales with insertion depth.
 */
export function TissueDeformation() {
  const meshRef = useRef<THREE.Mesh>(null);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const geometry = useMemo(() => {
    // Small indentation indicator: a subtle ring at the RCM point
    return new THREE.RingGeometry(0.3, 1.0, 32);
  }, []);

  useFrame(() => {
    if (!meshRef.current || !rcmPoint || !surfaceNormal) return;

    // Position at RCM point, slightly outside the surface
    const offset = 0.1;
    meshRef.current.position.set(
      rcmPoint[0] + surfaceNormal[0] * offset,
      rcmPoint[1] + surfaceNormal[1] * offset,
      rcmPoint[2] + surfaceNormal[2] * offset
    );

    // Face outward along the surface normal
    meshRef.current.lookAt(
      rcmPoint[0] + surfaceNormal[0] * 2,
      rcmPoint[1] + surfaceNormal[1] * 2,
      rcmPoint[2] + surfaceNormal[2] * 2
    );

    // Scale and opacity based on insertion depth
    const maxDepth = 18;
    const depthRatio = Math.min(insertionDepth / maxDepth, 1);
    const scale = 0.5 + depthRatio * 1.5;
    meshRef.current.scale.set(scale, scale, scale);

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.opacity = 0.1 + depthRatio * 0.4;
  });

  if (!rcmPoint || !surfaceNormal) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#cc4444"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
