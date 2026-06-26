import { useMemo, useRef, useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';
import type { NeedlePose } from '../types';

/**
 * Derives needle pose from store state — single source of truth.
 *
 * Replaces the pattern of each consumer building RCMConfig and calling
 * computeNeedlePose independently. One computation, shared via this hook.
 */
export function useNeedlePose(): NeedlePose | null {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  return useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;
    const config: RCMConfig = {
      rcmPoint,
      surfaceNormal,
      maxInsertionDepth: MAX_INSERTION_DEPTH,
      maxTiltAngle: MAX_TILT_ANGLE,
    };
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);
}

/**
 * Ref-access version for use inside useFrame / non-React contexts.
 * Uses useEffect to safely sync the ref after render.
 */
export function useNeedlePoseRef(): { current: NeedlePose | null } {
  const pose = useNeedlePose();
  const ref = useRef<NeedlePose | null>(pose);
  useEffect(() => {
    ref.current = pose;
  });
  return ref;
}
