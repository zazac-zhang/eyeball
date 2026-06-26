export type Vec3 = [number, number, number];

export type SimulationMode = 'VIEW' | 'PLACE' | 'EDIT' | 'REPLAY';

export const SurgicalPhase = {
  IDLE: 'IDLE',
  CONTACT: 'CONTACT',
  INSERTING: 'INSERTING',
  WITHDRAWING: 'WITHDRAWING',
  COMPLETE: 'COMPLETE',
} as const;

export type SurgicalPhase = (typeof SurgicalPhase)[keyof typeof SurgicalPhase];

export interface NeedlePose {
  tipPosition: Vec3;
  shaftDirection: Vec3;
  insertionDepth: number;
  tiltAlpha: number;
  tiltBeta: number;
  needleTransform: Float64Array;
}

/** Full state snapshot at a single moment during simulation */
export interface TrailPoint {
  tipPosition: Vec3;
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;
  timestamp: number; // Unix timestamp in ms
}
