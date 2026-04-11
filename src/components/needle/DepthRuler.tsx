import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';

const TICK_SPACING = 5; // mm between marks

/**
 * Tick marks on the needle shaft at regular intervals, showing insertion depth.
 */
export function DepthRuler() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const groupRef = useRef<THREE.Group>(null);

  const tickPositions = useMemo(() => {
    const ticks: number[] = [];
    for (let d = 0; d <= insertionDepth; d += TICK_SPACING) {
      ticks.push(d);
    }
    return ticks;
  }, [insertionDepth]);

  // Sync group transform to needle pose
  const needleTransform = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;
    const config: RCMConfig = {
      rcmPoint,
      surfaceNormal,
      maxInsertionDepth: MAX_INSERTION_DEPTH,
      maxTiltAngle: MAX_TILT_ANGLE,
    };
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth).needleTransform;
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  if (!needleTransform || tickPositions.length === 0) return null;

  return (
    <group
      ref={groupRef}
      matrixAutoUpdate={false}
      matrix={new THREE.Matrix4().fromArray(Array.from(needleTransform))}
    >
      {tickPositions.map((d) => (
        <mesh key={d} position={[0, 0, d]}>
          <boxGeometry args={[0.6, 0.04, 0.04]} />
          <meshBasicMaterial color="#44ff88" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}
