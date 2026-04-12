import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { COLORS } from '../../constants';

export function RCMIndicator() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const isDraggingRCM = useSimulationStore((s) => s.isDraggingRCM);
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(isDraggingRCM ? 0.5 : 0.3, 16, 16);
  }, [isDraggingRCM]);

  if (!rcmPoint) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={new THREE.Vector3(rcmPoint[0], rcmPoint[1], rcmPoint[2])}
    >
      <meshStandardMaterial
        color={isDraggingRCM ? '#ffaa00' : COLORS.rcmIndicator}
        emissive={isDraggingRCM ? '#ffaa00' : COLORS.rcmIndicator}
        emissiveIntensity={isDraggingRCM ? 1.2 : 0.8}
        transparent
        opacity={isDraggingRCM ? 1.0 : 0.9}
      />
    </mesh>
  );
}
