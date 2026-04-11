import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { NeedleShaft } from './NeedleShaft';
import { NeedleTip } from './NeedleTip';

// How much of the needle shaft is visible outside the eyeball (mm)
const OUTSIDE_LENGTH = 15;

export function Needle() {
  const groupRef = useRef<THREE.Group>(null);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const pose = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;
    const config: RCMConfig = {
      rcmPoint,
      surfaceNormal,
      maxInsertionDepth: MAX_INSERTION_DEPTH,
      maxTiltAngle: MAX_TILT_ANGLE,
    };
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  // Build the full needle transform as a Three.js matrix
  useEffect(() => {
    if (!groupRef.current || !pose) return;
    // pose.needleTransform is column-major 4x4
    groupRef.current.matrix.fromArray(Array.from(pose.needleTransform));
    groupRef.current.matrixWorldNeedsUpdate = true;
  }, [pose]);

  if (!pose) return null;

  const d = pose.insertionDepth;
  // Total shaft length: visible outside + insertion inside
  const totalShaftLength = OUTSIDE_LENGTH + d;

  return (
    <group ref={groupRef} matrixAutoUpdate={false}>
      {/* Shaft extends from -OUTSIDE_LENGTH to +d along local z */}
      <NeedleShaft length={totalShaftLength} offset={-(OUTSIDE_LENGTH - d) / 2} />
      {/* Tip is at +d along local z (relative to RCM origin) */}
      <NeedleTip position={[0, 0, d]} />
    </group>
  );
}
