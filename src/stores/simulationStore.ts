import { create } from 'zustand';
import type { Vec3, NeedlePose, SurgicalPhase, TrailPoint, SimulationMode } from '../types';
import { SurgicalPhase as Phase } from '../types';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';

const MAX_TRAIL_POINTS = 5000;

export interface SimulationState {
  // Mode
  mode: SimulationMode;

  // RCM configuration
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;
  isDraggingRCM: boolean;

  // Needle parameters
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;

  // Workflow
  phase: SurgicalPhase;

  // Trajectory
  trailPoints: Vec3[];
  trailData: TrailPoint[];

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;
  playbackIndex: number;

  // Actions
  setMode: (mode: SimulationMode) => void;
  setRCMPoint: (rcmPoint: Vec3, surfaceNormal: Vec3) => void;
  setIsDraggingRCM: (isDragging: boolean) => void;
  setTiltAngles: (alpha: number, beta: number) => void;
  setInsertionDepth: (depth: number) => void;
  setPhase: (phase: SurgicalPhase) => void;
  addTrailPoint: (point: Vec3, tiltAlpha: number, tiltBeta: number, insertionDepth: number) => void;
  importTrailData: (data: TrailPoint[]) => void;
  clearTrails: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackIndex: (index: number) => void;
  advancePlayback: () => void;
  completeSurgery: () => void;
  reset: () => void;
  getNeedlePose: () => NeedlePose | null;
}

function getRCMConfig(
  state: Pick<SimulationState, 'rcmPoint' | 'surfaceNormal'>
): RCMConfig | null {
  if (!state.rcmPoint || !state.surfaceNormal) return null;
  return {
    rcmPoint: state.rcmPoint,
    surfaceNormal: state.surfaceNormal,
    maxInsertionDepth: MAX_INSERTION_DEPTH,
    maxTiltAngle: MAX_TILT_ANGLE,
  };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'VIEW',
  rcmPoint: null,
  surfaceNormal: null,
  isDraggingRCM: false,
  tiltAlpha: 0,
  tiltBeta: 0,
  insertionDepth: 0,
  phase: Phase.IDLE,
  trailPoints: [],
  trailData: [],
  isPlaying: false,
  playbackSpeed: 1,
  playbackIndex: 0,

  setMode: (mode) => {
    set({ mode });
  },

  setRCMPoint: (rcmPoint, surfaceNormal) => {
    set({ rcmPoint, surfaceNormal, phase: Phase.CONTACT, mode: 'EDIT' });
  },

  setIsDraggingRCM: (isDraggingRCM) => {
    set({ isDraggingRCM });
  },

  setTiltAngles: (tiltAlpha, tiltBeta) => {
    const clampedAlpha = Math.max(-MAX_TILT_ANGLE, Math.min(MAX_TILT_ANGLE, tiltAlpha));
    const { phase } = get();
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
      newPhase = Phase.WITHDRAWING;
    }
    // Note: WITHDRAWING → COMPLETE requires explicit user action (completeSurgery)
    set({ insertionDepth: clamped, phase: newPhase });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  addTrailPoint: (tipPosition, tiltAlpha, tiltBeta, insertionDepth) => {
    set((state) => {
      const point: TrailPoint = { tipPosition, tiltAlpha, tiltBeta, insertionDepth };
      const newData = [...state.trailData, point];
      const newPositions = [...state.trailPoints, tipPosition];
      if (newData.length > MAX_TRAIL_POINTS) {
        newData.splice(0, newData.length - MAX_TRAIL_POINTS);
        newPositions.splice(0, newPositions.length - MAX_TRAIL_POINTS);
      }
      return { trailData: newData, trailPoints: newPositions };
    });
  },

  clearTrails: () => {
    set({ trailPoints: [], trailData: [] });
  },

  importTrailData: (data: TrailPoint[]) => {
    const sliced = data.slice(0, MAX_TRAIL_POINTS);
    set({
      trailData: sliced,
      trailPoints: sliced.map((d) => d.tipPosition),
      playbackIndex: 0,
      isPlaying: false,
    });
  },

  togglePlayback: () => {
    const { isPlaying } = get();
    if (!isPlaying) {
      set({ isPlaying: true, playbackIndex: 0 });
    } else {
      set({ isPlaying: false, playbackIndex: 0 });
    }
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  setPlaybackIndex: (index) => {
    set({ playbackIndex: index });
  },

  advancePlayback: () => {
    const { playbackIndex, playbackSpeed, trailData, isPlaying } = get();
    if (!isPlaying || trailData.length === 0) return;

    const nextIndex = playbackIndex + playbackSpeed;
    if (nextIndex >= trailData.length - 1) {
      set({ isPlaying: false, playbackIndex: 0 });
      return;
    }

    const idx = Math.floor(nextIndex);
    const currentPoint = trailData[idx];
    set({
      tiltAlpha: currentPoint.tiltAlpha,
      tiltBeta: currentPoint.tiltBeta,
      insertionDepth: currentPoint.insertionDepth,
      playbackIndex: nextIndex,
    });
  },

  completeSurgery: () => {
    const { phase } = get();
    if (phase === Phase.WITHDRAWING) {
      set({ phase: Phase.COMPLETE });
    }
  },

  reset: () => {
    set({
      mode: 'VIEW',
      rcmPoint: null,
      surfaceNormal: null,
      isDraggingRCM: false,
      tiltAlpha: 0,
      tiltBeta: 0,
      insertionDepth: 0,
      phase: Phase.IDLE,
      trailPoints: [],
      trailData: [],
      isPlaying: false,
      playbackSpeed: 1,
      playbackIndex: 0,
    });
  },

  getNeedlePose: () => {
    const config = getRCMConfig(get());
    if (!config) return null;
    const { tiltAlpha, tiltBeta, insertionDepth } = get();
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
  },
}));
