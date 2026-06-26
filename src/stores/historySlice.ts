import type { StateCreator } from 'zustand';
import type { Vec3, TrailPoint, SurgicalPhase } from '../types';
import type { SimulationState } from './simulationStore';

const MAX_HISTORY = 50;

export interface HistoryState {
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;
  phase: SurgicalPhase;
  trailPoints: Vec3[];
  trailData: TrailPoint[];
}

export interface HistorySlice {
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

function createHistorySnapshot(state: SimulationState): HistoryState {
  const currentRCM = state.rcmPoints[state.currentRCMIndex];
  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    rcmPoint: currentRCM ? ([...currentRCM.point] as Vec3) : null,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    surfaceNormal: currentRCM ? ([...currentRCM.normal] as Vec3) : null,
    tiltAlpha: state.tiltAlpha,
    tiltBeta: state.tiltBeta,
    insertionDepth: state.insertionDepth,
    phase: state.phase,
    trailPoints: state.trailPoints.map((p) => [...p] as Vec3),
    trailData: state.trailData.map((d) => ({
      ...d,
      tipPosition: [...d.tipPosition] as Vec3,
    })),
  };
}

export const createHistorySlice: StateCreator<SimulationState, [], [], HistorySlice> = (set, get) => ({
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  saveToHistory: () => {
    const state = get();
    const snapshot = createHistorySnapshot(state);

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

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
});
