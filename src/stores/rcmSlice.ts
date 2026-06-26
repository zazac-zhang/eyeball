import type { StateCreator } from 'zustand';
import type { Vec3 } from '../types';
import { transitionPhase } from '../lib/phaseMachine';
import type { SimulationState } from './simulationStore';

export interface RCMPoint {
  id: string;
  point: Vec3;
  normal: Vec3;
}

export interface RCMSlice {
  rcmPoints: RCMPoint[];
  currentRCMIndex: number;
  isDraggingRCM: boolean;

  // Backward compat: derived from rcmPoints[currentRCMIndex]
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;

  addRCMPoint: (point: Vec3, normal: Vec3) => void;
  removeRCMPoint: (index: number) => void;
  setCurrentRCMIndex: (index: number) => void;
  updateRCMPoint: (index: number, point: Vec3, normal: Vec3) => void;
  setIsDraggingRCM: (isDragging: boolean) => void;
}

export const createRCMSlice: StateCreator<SimulationState, [], [], RCMSlice> = (set, get) => ({
  rcmPoints: [],
  currentRCMIndex: -1,
  isDraggingRCM: false,
  rcmPoint: null,
  surfaceNormal: null,

  addRCMPoint: (point, normal) => {
    const newRCM: RCMPoint = {
      id: `rcm-${String(Date.now())}`,
      point,
      normal,
    };
    set((state) => {
      const newPhase = transitionPhase(state.phase, 'placeRCM');
      return {
        rcmPoints: [...state.rcmPoints, newRCM],
        currentRCMIndex: state.rcmPoints.length,
        phase: newPhase,
        mode: 'EDIT' as const,
        rcmPoint: point,
        surfaceNormal: normal,
      };
    });
    if (!get().isDraggingRCM) {
      get().saveToHistory();
    }
  },

  removeRCMPoint: (index) => {
    set((state) => {
      const newRCMPoints = state.rcmPoints.filter((_, i) => i !== index);
      const newCurrentIndex =
        state.currentRCMIndex === index
          ? -1
          : state.currentRCMIndex > index
            ? state.currentRCMIndex - 1
            : state.currentRCMIndex;
      const finalIndex = Math.min(newCurrentIndex, newRCMPoints.length - 1);
      const currentRCM = newRCMPoints[finalIndex];
      return {
        rcmPoints: newRCMPoints,
        currentRCMIndex: finalIndex,
        phase: newRCMPoints.length === 0 ? 'IDLE' : state.phase,
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
});
