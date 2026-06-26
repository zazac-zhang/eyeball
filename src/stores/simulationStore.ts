import { create } from 'zustand';
import type { NeedlePose } from '../types';
import { computeNeedlePose, type RCMConfig } from '../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';

// Slices
import { createRCMSlice } from './rcmSlice';
import { createNeedleSlice } from './needleSlice';
import { createTrajectorySlice } from './trajectorySlice';
import { createHistorySlice } from './historySlice';
import type { RCMSlice } from './rcmSlice';
import type { NeedleSlice } from './needleSlice';
import type { TrajectorySlice } from './trajectorySlice';
import type { HistorySlice } from './historySlice';

// Re-export for consumers
export type { RCMPoint } from './rcmSlice';

/** Full composed store type */
export type SimulationState = RCMSlice & NeedleSlice & TrajectorySlice & HistorySlice & {
  getNeedlePose: () => NeedlePose | null;
};

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

export const useSimulationStore = create<SimulationState>()((set, get, api) => ({
  ...createRCMSlice(set, get, api),
  ...createNeedleSlice(set, get, api),
  ...createTrajectorySlice(set, get, api),
  ...createHistorySlice(set, get, api),

  getNeedlePose: () => {
    const state = get();
    const config = getRCMConfig(state);
    if (!config) return null;
    return computeNeedlePose(config, state.tiltAlpha, state.tiltBeta, state.insertionDepth);
  },
}));
