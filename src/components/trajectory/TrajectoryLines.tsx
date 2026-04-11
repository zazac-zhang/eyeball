import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { COLORS } from '../../constants';

export function TrajectoryLines() {
  const trailPoints = useSimulationStore((s) => s.trailPoints);
  const isPlaying = useSimulationStore((s) => s.isPlaying);

  if (trailPoints.length < 2) return null;

  const points = trailPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));

  return (
    <Line
      points={points}
      color={COLORS.trajectory}
      lineWidth={2}
      transparent
      opacity={isPlaying ? 0.4 : 0.8}
    />
  );
}
