import type { StateCreator } from 'zustand';
import type { SimulationMode, SurgicalPhase } from '../types';
import { transitionPhase } from '../lib/phaseMachine';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';
import type { SimulationState } from './simulationStore';

export interface NeedleSlice {
  mode: SimulationMode;
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;
  phase: SurgicalPhase;

  setMode: (mode: SimulationMode) => void;
  setTiltAngles: (alpha: number, beta: number) => void;
  setInsertionDepth: (depth: number) => void;
  setPhase: (phase: SurgicalPhase) => void;
  completeSurgery: () => void;
  reset: () => void;
}

export const createNeedleSlice: StateCreator<SimulationState, [], [], NeedleSlice> = (set, get) => ({
  mode: 'VIEW',
  tiltAlpha: 0,
  tiltBeta: 0,
  insertionDepth: 0,
  phase: 'IDLE',

  setMode: (mode) => {
    set({ mode });
  },

  setTiltAngles: (tiltAlpha, tiltBeta) => {
    const clampedAlpha = Math.max(-MAX_TILT_ANGLE, Math.min(MAX_TILT_ANGLE, tiltAlpha));
    const { phase } = get();
    const newPhase = phase === 'CONTACT' ? transitionPhase(phase, 'needleMoved') : phase;
    set({ tiltAlpha: clampedAlpha, tiltBeta, phase: newPhase });
  },

  setInsertionDepth: (insertionDepth) => {
    const clamped = Math.max(0, Math.min(insertionDepth, MAX_INSERTION_DEPTH));
    const { phase } = get();
    let newPhase = phase;
    if (phase === 'CONTACT') {
      newPhase = transitionPhase(phase, 'needleMoved');
    } else if (clamped <= 0 && phase === 'INSERTING') {
      newPhase = transitionPhase(phase, 'depthReturned');
    }
    set({ insertionDepth: clamped, phase: newPhase });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  completeSurgery: () => {
    const { phase } = get();
    const newPhase = transitionPhase(phase, 'completeSurgery');
    if (newPhase !== phase) {
      set({ phase: newPhase });
    }
  },

  reset: () => {
    set({
      mode: 'VIEW',
      tiltAlpha: 0,
      tiltBeta: 0,
      insertionDepth: 0,
      phase: 'IDLE',
      // Reset sibling slices
      rcmPoints: [],
      currentRCMIndex: -1,
      isDraggingRCM: false,
      rcmPoint: null,
      surfaceNormal: null,
      trailPoints: [],
      trailData: [],
      chartData: [],
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,
      isPlaying: false,
      playbackSpeed: 1,
      playbackIndex: 0,
    });
  },
});
