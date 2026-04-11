import { create } from 'zustand';
import type { Vec3, NeedlePose, SurgicalPhase } from '../types';
import { SurgicalPhase as Phase } from '../types';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';

// Maximum number of trail points to keep in memory
const MAX_TRAIL_POINTS = 5000;

export interface SimulationState {
  // RCM configuration
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;

  // Needle parameters
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;

  // Workflow
  phase: SurgicalPhase;
  isPlaying: boolean;
  playbackSpeed: number;
  playbackIndex: number;

  // Trajectory
  trailPoints: Vec3[];

  // Actions
  setRCMPoint: (rcmPoint: Vec3, surfaceNormal: Vec3) => void;
  setTiltAngles: (alpha: number, beta: number) => void;
  setInsertionDepth: (depth: number) => void;
  setPhase: (phase: SurgicalPhase) => void;
  addTrailPoint: (point: Vec3) => void;
  clearTrails: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackPose: (alpha: number, beta: number, depth: number) => void;
  advancePlayback: () => boolean;
  reset: () => void;
  getNeedlePose: () => NeedlePose | null;
}

function getRCMConfig(state: Pick<SimulationState, 'rcmPoint' | 'surfaceNormal'>): RCMConfig | null {
  if (!state.rcmPoint || !state.surfaceNormal) return null;
  return {
    rcmPoint: state.rcmPoint,
    surfaceNormal: state.surfaceNormal,
    maxInsertionDepth: MAX_INSERTION_DEPTH,
    maxTiltAngle: MAX_TILT_ANGLE,
  };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  rcmPoint: null,
  surfaceNormal: null,
  tiltAlpha: 0,
  tiltBeta: 0,
  insertionDepth: 0,
  phase: Phase.IDLE,
  isPlaying: false,
  playbackSpeed: 1,
  playbackIndex: 0,
  trailPoints: [],

  setRCMPoint: (rcmPoint, surfaceNormal) =>
    set({ rcmPoint, surfaceNormal, phase: Phase.CONTACT }),

  setTiltAngles: (tiltAlpha, tiltBeta) => {
    const clampedAlpha = Math.max(-MAX_TILT_ANGLE, Math.min(MAX_TILT_ANGLE, tiltAlpha));
    const { phase } = get();
    // Transition to INSERTING when user starts manipulating after CONTACT
    const newPhase = phase === Phase.CONTACT ? Phase.INSERTING : phase;
    set({ tiltAlpha: clampedAlpha, tiltBeta, phase: newPhase });
  },

  setInsertionDepth: (insertionDepth) => {
    const clamped = Math.max(0, Math.min(insertionDepth, MAX_INSERTION_DEPTH));
    const { phase } = get();
    let newPhase = phase;
    if (phase === Phase.CONTACT) {
      newPhase = Phase.INSERTING;
    } else if (clamped <= 0 && phase === Phase.INSERTING) {
      newPhase = Phase.COMPLETE;
    }
    set({ insertionDepth: clamped, phase: newPhase });
  },

  setPhase: (phase) => set({ phase }),

  addTrailPoint: (point) =>
    set((state) => {
      const newPoints = [...state.trailPoints, point];
      // Cap the trail points to prevent unbounded growth
      if (newPoints.length > MAX_TRAIL_POINTS) {
        newPoints.splice(0, newPoints.length - MAX_TRAIL_POINTS);
      }
      return { trailPoints: newPoints };
    }),

  clearTrails: () => set({ trailPoints: [] }),

  togglePlayback: () => {
    const { trailPoints, isPlaying } = get();
    if (!isPlaying && trailPoints.length < 2) return; // Nothing to play
    if (!isPlaying) {
      set({ isPlaying: true, playbackIndex: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  setPlaybackPose: (tiltAlpha, tiltBeta, insertionDepth) =>
    set({ tiltAlpha, tiltBeta, insertionDepth }),

  advancePlayback: (): boolean => {
    const { trailPoints, playbackIndex, playbackSpeed } = get();
    if (playbackIndex >= trailPoints.length - 1) {
      set({ isPlaying: false, playbackIndex: 0 });
      return false;
    }

    // During playback, step through recorded poses
    // We interpolate between consecutive trail points
    const stepsPerPoint = Math.max(1, Math.round(4 / playbackSpeed));
    const currentStep = playbackIndex % stepsPerPoint;
    const pointIndex = Math.floor(playbackIndex / stepsPerPoint);

    if (pointIndex >= trailPoints.length - 2) {
      set({ isPlaying: false, playbackIndex: 0 });
      return false;
    }

    const from = trailPoints[pointIndex];
    const to = trailPoints[pointIndex + 1];
    const t = currentStep / stepsPerPoint;

    const pose = [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ] as Vec3;

    // We need to reconstruct alpha/beta/depth from the tip position
    // For playback, directly set the pose from trail data
    set({
      tiltAlpha: get().tiltAlpha, // Keep current angles during playback
      tiltBeta: get().tiltBeta,
      insertionDepth: Math.sqrt(
        (pose[0] - (get().rcmPoint?.[0] ?? 0)) ** 2 +
        (pose[1] - (get().rcmPoint?.[1] ?? 0)) ** 2 +
        (pose[2] - (get().rcmPoint?.[2] ?? 0)) ** 2
      ),
      playbackIndex: playbackIndex + 1,
    });

    return true;
  },

  reset: () =>
    set({
      rcmPoint: null,
      surfaceNormal: null,
      tiltAlpha: 0,
      tiltBeta: 0,
      insertionDepth: 0,
      phase: Phase.IDLE,
      isPlaying: false,
      playbackSpeed: 1,
      playbackIndex: 0,
      trailPoints: [],
    }),

  getNeedlePose: () => {
    const config = getRCMConfig(get());
    if (!config) return null;
    const { tiltAlpha, tiltBeta, insertionDepth } = get();
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
  },
}));
