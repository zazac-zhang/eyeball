export type Vec3 = [number, number, number];

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

export interface SimulationState {
  rcmPoint: Vec3 | null;
  surfaceNormal: Vec3 | null;
  tiltAlpha: number;
  tiltBeta: number;
  insertionDepth: number;
  phase: SurgicalPhase;
  isPlaying: boolean;
  playbackSpeed: number;
  trailPoints: Vec3[];
  rcmTrailPoints: Vec3[];
}
