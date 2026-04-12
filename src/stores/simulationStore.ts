import { create } from 'zustand';
import type { Vec3, NeedlePose, SurgicalPhase, TrailPoint, SimulationMode, HistoryState } from '../types';
import { SurgicalPhase as Phase } from '../types';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';

const MAX_TRAIL_POINTS = 5000;
const MAX_HISTORY = 50;

export interface RCMPoint {
  id: string;
  point: Vec3;
  normal: Vec3;
}

export interface SimulationState {
  // Mode
  mode: SimulationMode;

  // RCM configuration (multiple points support)
  rcmPoints: RCMPoint[];
  currentRCMIndex: number;
  isDraggingRCM: boolean;

  // Computed values for backward compatibility
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;

  // Needle parameters
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;

  // Workflow
  phase: SurgicalPhase;

  // Trajectory
  trailPoints: Vec3[];
  trailData: TrailPoint[];

  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;
  playbackIndex: number;

  // Actions
  setMode: (mode: SimulationMode) => void;
  addRCMPoint: (point: Vec3, normal: Vec3) => void;
  removeRCMPoint: (index: number) => void;
  setCurrentRCMIndex: (index: number) => void;
  updateRCMPoint: (index: number, point: Vec3, normal: Vec3) => void;
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
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

function getRCMConfig(state: SimulationState): RCMConfig | null {
  const currentRCM = state.rcmPoints[state.currentRCMIndex];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!currentRCM) {
    return null;
  }
  return {
    rcmPoint: currentRCM.point,
    surfaceNormal: currentRCM.normal,
    maxInsertionDepth: MAX_INSERTION_DEPTH,
    maxTiltAngle: MAX_TILT_ANGLE,
  };
}

function createHistorySnapshot(state: SimulationState): HistoryState {
  const currentRCM = state.rcmPoints[state.currentRCMIndex];
  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    rcmPoint: currentRCM ? [...currentRCM.point] : null,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    surfaceNormal: currentRCM ? [...currentRCM.normal] : null,
    tiltAlpha: state.tiltAlpha,
    tiltBeta: state.tiltBeta,
    insertionDepth: state.insertionDepth,
    phase: state.phase,
    trailPoints: state.trailPoints.map((p) => [...p]) as Vec3[],
    trailData: state.trailData.map((d) => ({
      ...d,
      tipPosition: [...d.tipPosition] as Vec3,
    })),
  };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'VIEW',
  rcmPoints: [],
  currentRCMIndex: -1,
  isDraggingRCM: false,
  rcmPoint: null,
  surfaceNormal: null,
  tiltAlpha: 0,
  tiltBeta: 0,
  insertionDepth: 0,
  phase: Phase.IDLE,
  trailPoints: [],
  trailData: [],
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  isPlaying: false,
  playbackSpeed: 1,
  playbackIndex: 0,

  setMode: (mode) => {
    set({ mode });
  },

  addRCMPoint: (point, normal) => {
    const { isDraggingRCM } = get();
    const newRCM: RCMPoint = {
      id: `rcm-${String(Date.now())}`,
      point,
      normal,
    };
    set((state) => {
      const newPhase = Phase.CONTACT;
      const newMode: SimulationMode = 'EDIT';
      const newState = {
        rcmPoints: [...state.rcmPoints, newRCM],
        currentRCMIndex: state.rcmPoints.length,
        phase: newPhase,
        mode: newMode,
        rcmPoint: point,
        surfaceNormal: normal,
      };
      return newState;
    });
    // Don't save history while dragging
    if (!isDraggingRCM) {
      get().saveToHistory();
    }
  },

  removeRCMPoint: (index) => {
    set((state) => {
      const newRCMPoints = state.rcmPoints.filter((_, i) => i !== index);
      const newCurrentIndex = state.currentRCMIndex === index ? -1 :
                            state.currentRCMIndex > index ? state.currentRCMIndex - 1 :
                            state.currentRCMIndex;
      const finalIndex = Math.min(newCurrentIndex, newRCMPoints.length - 1);
      const currentRCM = newRCMPoints[finalIndex];
      return {
        rcmPoints: newRCMPoints,
        currentRCMIndex: finalIndex,
        phase: newRCMPoints.length === 0 ? Phase.IDLE : state.phase,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        rcmPoint: currentRCM ? currentRCM.point : null,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        surfaceNormal: currentRCM ? currentRCM.normal : null,
      };
    });
  },

  setCurrentRCMIndex: (index) => {
    set((state) => {
      const currentRCM = state.rcmPoints[index];
      return {
        currentRCMIndex: index,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        rcmPoint: currentRCM ? currentRCM.point : null,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        surfaceNormal: currentRCM ? currentRCM.normal : null,
      };
    });
  },

  updateRCMPoint: (index, point, normal) => {
    set((state) => {
      const newRCMPoints = [...state.rcmPoints];
      newRCMPoints[index] = { ...newRCMPoints[index], point, normal };
      const isCurrent = state.currentRCMIndex === index;
      return {
        rcmPoints: newRCMPoints,
        rcmPoint: isCurrent ? point : state.rcmPoint,
        surfaceNormal: isCurrent ? normal : state.surfaceNormal,
      };
    });
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
      const point: TrailPoint = {
        tipPosition,
        tiltAlpha,
        tiltBeta,
        insertionDepth,
        timestamp: Date.now(),
      };
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

  saveToHistory: () => {
    const state = get();
    const snapshot = createHistorySnapshot(state);

    // Remove any future history if we're not at the end
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 0,
      canRedo: false,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;

    const previousState = history[historyIndex];
    set({
      rcmPoint: previousState.rcmPoint,
      surfaceNormal: previousState.surfaceNormal,
      tiltAlpha: previousState.tiltAlpha,
      tiltBeta: previousState.tiltBeta,
      insertionDepth: previousState.insertionDepth,
      phase: previousState.phase,
      trailPoints: previousState.trailPoints,
      trailData: previousState.trailData,
      historyIndex: historyIndex - 1,
      canUndo: historyIndex > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const nextState = history[historyIndex + 1];
    set({
      rcmPoint: nextState.rcmPoint,
      surfaceNormal: nextState.surfaceNormal,
      tiltAlpha: nextState.tiltAlpha,
      tiltBeta: nextState.tiltBeta,
      insertionDepth: nextState.insertionDepth,
      phase: nextState.phase,
      trailPoints: nextState.trailPoints,
      trailData: nextState.trailData,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: historyIndex + 1 < history.length - 1,
    });
  },

  reset: () => {
    set({
      mode: 'VIEW',
      rcmPoints: [],
      currentRCMIndex: -1,
      isDraggingRCM: false,
      rcmPoint: null,
      surfaceNormal: null,
      tiltAlpha: 0,
      tiltBeta: 0,
      insertionDepth: 0,
      phase: Phase.IDLE,
      trailPoints: [],
      trailData: [],
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,
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
