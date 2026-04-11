import { useRef } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { COLORS } from '../../constants';

export function RCMIndicator() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const meshRef = useRef<THREE.Mesh>(null);

  if (!rcmPoint) return null;

  return (
    <mesh
      ref={meshRef}
      position={new THREE.Vector3(rcmPoint[0], rcmPoint[1], rcmPoint[2])}
    >
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color={COLORS.rcmIndicator}
        emissive={COLORS.rcmIndicator}
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
