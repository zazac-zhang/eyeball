import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { COLORS } from '../../constants';

export function RCMIndicator() {
  const rcmPoints = useSimulationStore((s) => s.rcmPoints);
  const currentRCMIndex = useSimulationStore((s) => s.currentRCMIndex);
  const isDraggingRCM = useSimulationStore((s) => s.isDraggingRCM);

  const geometries = useMemo(() => {
    return rcmPoints.map((_, index) => {
      const isCurrent = index === currentRCMIndex;
      const radius = isCurrent ? (isDraggingRCM ? 0.5 : 0.3) : 0.2;
      return new THREE.SphereGeometry(radius, 16, 16);
    });
  }, [rcmPoints, currentRCMIndex, isDraggingRCM]);

  if (rcmPoints.length === 0) return null;

  return (
    <>
      {rcmPoints.map((rcm, index) => {
        const isCurrent = index === currentRCMIndex;
        const position = new THREE.Vector3(rcm.point[0], rcm.point[1], rcm.point[2]);

        return (
          <mesh
            key={rcm.id}
            geometry={geometries[index]}
            position={position}
          >
            <meshStandardMaterial
              color={
                isDraggingRCM && isCurrent
                  ? '#ffaa00'
                  : isCurrent
                    ? COLORS.rcmIndicator
                    : '#4488ff'
              }
              emissive={
                isDraggingRCM && isCurrent
                  ? '#ffaa00'
                  : isCurrent
                    ? COLORS.rcmIndicator
                    : '#4488ff'
              }
              emissiveIntensity={isCurrent ? (isDraggingRCM ? 1.2 : 0.8) : 0.4}
              transparent
              opacity={isCurrent ? (isDraggingRCM ? 1.0 : 0.9) : 0.6}
            />
          </mesh>
        );
      })}
    </>
  );
}
