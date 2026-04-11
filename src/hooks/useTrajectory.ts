import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';

const RECORD_INTERVAL = 0.05;
const PLAYBACK_STEP_MS = 16; // ~60fps step

export function useTrajectoryRecorder() {
  const timer = useRef(0);
  const playbackTimer = useRef(0);
  const addTrailPoint = useSimulationStore((s) => s.addTrailPoint);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const advancePlayback = useSimulationStore((s) => s.advancePlayback);

  useFrame((_, delta) => {
    // During playback, advance through recorded trajectory
    if (isPlaying) {
      playbackTimer.current += delta;
      if (playbackTimer.current >= PLAYBACK_STEP_MS / 1000) {
        playbackTimer.current = 0;
        advancePlayback();
      }
      return; // Don't record during playback
    }

    // Recording mode: sample needle tip position
    if (!rcmPoint || !surfaceNormal) return;

    timer.current += delta;
    if (timer.current >= RECORD_INTERVAL) {
      timer.current = 0;
      const config: RCMConfig = {
        rcmPoint,
        surfaceNormal,
        maxInsertionDepth: MAX_INSERTION_DEPTH,
        maxTiltAngle: MAX_TILT_ANGLE,
      };
      const pose = computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
      addTrailPoint(pose.tipPosition);
    }
  });
}
