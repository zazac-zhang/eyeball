import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../stores/simulationStore';
import { useNeedlePoseRef } from './useNeedlePose';

const RECORD_INTERVAL = 0.05;

export function useTrajectoryRecorder() {
  const timer = useRef(0);
  const addTrailPoint = useSimulationStore((s) => s.addTrailPoint);
  const mode = useSimulationStore((s) => s.mode);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const advancePlayback = useSimulationStore((s) => s.advancePlayback);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const poseRef = useNeedlePoseRef();

  useFrame((_, delta) => {
    if (!poseRef.current) return;

    if (mode === 'REPLAY' && isPlaying) {
      advancePlayback();
      return;
    }

    if (mode !== 'EDIT') return;

    timer.current += delta;
    if (timer.current >= RECORD_INTERVAL) {
      timer.current = 0;
      addTrailPoint(poseRef.current.tipPosition, tiltAlpha, tiltBeta, insertionDepth);
    }
  });
}
