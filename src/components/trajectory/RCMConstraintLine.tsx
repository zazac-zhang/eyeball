import { Line } from '@react-three/drei';
import { useSimulationStore } from '../../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { useMemo } from 'react';

/**
 * Dashed line from RCM point to needle tip showing the kinematic constraint axis.
 */
export function RCMConstraintLine() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const linePoints = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;
    const config: RCMConfig = {
      rcmPoint,
      surfaceNormal,
      maxInsertionDepth: MAX_INSERTION_DEPTH,
      maxTiltAngle: MAX_TILT_ANGLE,
    };
    const pose = computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
    return [
      [rcmPoint[0], rcmPoint[1], rcmPoint[2]],
      [pose.tipPosition[0], pose.tipPosition[1], pose.tipPosition[2]],
    ] as [number, number, number][];
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  if (!linePoints) return null;

  return (
    <Line points={linePoints} color="#4488ff" lineWidth={1} transparent opacity={0.6} dashed />
  );
}
