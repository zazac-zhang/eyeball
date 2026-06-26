import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useNeedlePose } from '../../hooks/useNeedlePose';
import { NeedleShaft } from './NeedleShaft';
import { CurvedNeedleTip } from './CurvedNeedleTip';
import { NeedleHolder } from './NeedleHolder';

// How much of the needle shaft is visible outside the eyeball (mm)
const OUTSIDE_LENGTH = 15;

export function Needle() {
  const groupRef = useRef<THREE.Group>(null);
  const pose = useNeedlePose();

  useEffect(() => {
    if (!groupRef.current || !pose) return;
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
      {/* Curved tip is at +d along local z (relative to RCM origin) */}
      <CurvedNeedleTip position={[0, 0, d]} />
      {/* Needle holder at the proximal end (-OUTSIDE_LENGTH) */}
      <NeedleHolder position={[0, 0, -OUTSIDE_LENGTH]} />
    </group>
  );
}
