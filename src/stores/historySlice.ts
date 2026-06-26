import type { StateCreator } from 'zustand';
import type { Vec3, SimulationMode, TrailPoint, SurgicalPhase } from '../types';
import type { SimulationState } from './simulationStore';
import type { RCMPoint } from './rcmSlice';

const MAX_HISTORY = 50;

export interface HistoryState {
  // Full RCM state (not just backward-compat single point)
  rcmPoints: RCMPoint[];
  currentRCMIndex: number;
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;
  mode: SimulationMode;
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
    rcmPoints: state.rcmPoints.map((r) => ({
      ...r,
      point: [...r.point] as Vec3,
      normal: [...r.normal] as Vec3,
    })),
    currentRCMIndex: state.currentRCMIndex,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    rcmPoint: currentRCM ? ([...currentRCM.point] as Vec3) : null,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    surfaceNormal: currentRCM ? ([...currentRCM.normal] as Vec3) : null,
    mode: state.mode,
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

function restoreFromSnapshot(snapshot: HistoryState): Partial<SimulationState> {
  return {
    rcmPoints: snapshot.rcmPoints.map((r) => ({
      ...r,
      point: [...r.point] as Vec3,
      normal: [...r.normal] as Vec3,
    })),
    currentRCMIndex: snapshot.currentRCMIndex,
    rcmPoint: snapshot.rcmPoint ? ([...snapshot.rcmPoint] as Vec3) : null,
    surfaceNormal: snapshot.surfaceNormal ? ([...snapshot.surfaceNormal] as Vec3) : null,
    mode: snapshot.mode,
    tiltAlpha: snapshot.tiltAlpha,
    tiltBeta: snapshot.tiltBeta,
    insertionDepth: snapshot.insertionDepth,
    phase: snapshot.phase,
    trailPoints: snapshot.trailPoints.map((p) => [...p] as Vec3),
    trailData: snapshot.trailData.map((d) => ({
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
      ...restoreFromSnapshot(previousState),
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
      ...restoreFromSnapshot(nextState),
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: historyIndex + 1 < history.length - 1,
    });
  },
});
