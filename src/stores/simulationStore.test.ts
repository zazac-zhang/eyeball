import { expect, test, describe, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore';
import { SurgicalPhase } from '../types';

beforeEach(() => {
  useSimulationStore.getState().reset();
});

describe('addRCMPoint', () => {
  test('transitions from IDLE to CONTACT', () => {
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.IDLE);
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.CONTACT);
    expect(useSimulationStore.getState().rcmPoint).toEqual([0, 0, 12]);
  });
});

describe('setTiltAngles', () => {
  test('transitions from CONTACT to INSERTING', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0.1, 0.2);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.INSERTING);
  });

  test('clamps alpha to max tilt angle', () => {
    useSimulationStore.getState().setTiltAngles(10, 0);
    expect(useSimulationStore.getState().tiltAlpha).toBeCloseTo(Math.PI / 4);
  });

  test('clamps alpha to negative max tilt angle', () => {
    useSimulationStore.getState().setTiltAngles(-10, 0);
    expect(useSimulationStore.getState().tiltAlpha).toBeCloseTo(-Math.PI / 4);
  });

  test('beta is not clamped (full range)', () => {
    useSimulationStore.getState().setTiltAngles(0, Math.PI * 2);
    expect(useSimulationStore.getState().tiltBeta).toBeCloseTo(Math.PI * 2);
  });
});

describe('setInsertionDepth', () => {
  test('clamps to max insertion depth', () => {
    useSimulationStore.getState().setInsertionDepth(100);
    expect(useSimulationStore.getState().insertionDepth).toBe(18);
  });

  test('clamps to zero for negative values', () => {
    useSimulationStore.getState().setInsertionDepth(-5);
    expect(useSimulationStore.getState().insertionDepth).toBe(0);
  });

  test('transitions CONTACT to INSERTING when depth > 0', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.CONTACT);
    useSimulationStore.getState().setInsertionDepth(5);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.INSERTING);
  });

  test('transitions INSERTING to WITHDRAWING when depth goes to 0', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0, 0);
    useSimulationStore.getState().setInsertionDepth(10);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.INSERTING);
    useSimulationStore.getState().setInsertionDepth(0);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.WITHDRAWING);
  });

  test('transitions WITHDRAWING to COMPLETE when depth is 0 again', () => {
    useSimulationStore.getState().setInsertionDepth(5);
    useSimulationStore.getState().setPhase(SurgicalPhase.WITHDRAWING);
    useSimulationStore.getState().setInsertionDepth(0);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.WITHDRAWING);
    // Complete transition now requires explicit user action
    useSimulationStore.getState().completeSurgery();
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.COMPLETE);
  });
});

describe('reset', () => {
  test('returns all state to initial values', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0.1, 0.2);
    useSimulationStore.getState().setInsertionDepth(10);
    useSimulationStore.getState().reset();
    const state = useSimulationStore.getState();
    expect(state.mode).toBe('VIEW');
    expect(state.rcmPoint).toBeNull();
    expect(state.surfaceNormal).toBeNull();
    expect(state.tiltAlpha).toBe(0);
    expect(state.tiltBeta).toBe(0);
    expect(state.insertionDepth).toBe(0);
    expect(state.phase).toBe(SurgicalPhase.IDLE);
    expect(state.trailPoints).toEqual([]);
    expect(state.trailData).toEqual([]);
    expect(state.isPlaying).toBe(false);
  });
});

describe('togglePlayback', () => {
  test('starts playback when trails exist', () => {
    useSimulationStore.getState().addTrailPoint([0, 0, 12], 0, 0, 0);
    useSimulationStore.getState().togglePlayback();
    expect(useSimulationStore.getState().isPlaying).toBe(true);
    expect(useSimulationStore.getState().playbackIndex).toBe(0);
  });

  test('stops playback and resets index', () => {
    useSimulationStore.getState().addTrailPoint([0, 0, 12], 0, 0, 0);
    useSimulationStore.getState().togglePlayback();
    expect(useSimulationStore.getState().isPlaying).toBe(true);
    useSimulationStore.getState().togglePlayback();
    expect(useSimulationStore.getState().isPlaying).toBe(false);
    expect(useSimulationStore.getState().playbackIndex).toBe(0);
  });
});

describe('advancePlayback', () => {
  test('updates angles and depth from trail data', () => {
    useSimulationStore.getState().addTrailPoint([1, 2, 11], 0.1, 0.2, 5);
    useSimulationStore.getState().addTrailPoint([2, 3, 10], 0.2, 0.3, 7);
    useSimulationStore.getState().addTrailPoint([3, 4, 9], 0.3, 0.4, 10);
    useSimulationStore.getState().togglePlayback();
    useSimulationStore.getState().advancePlayback();
    const state = useSimulationStore.getState();
    expect(state.tiltAlpha).toBeCloseTo(0.2);
    expect(state.tiltBeta).toBeCloseTo(0.3);
    expect(state.insertionDepth).toBe(7);
  });

  test('stops playback when reaching end of trail', () => {
    useSimulationStore.getState().addTrailPoint([0, 0, 12], 0, 0, 0);
    useSimulationStore.getState().addTrailPoint([1, 1, 11], 0.1, 0.1, 1);
    useSimulationStore.getState().togglePlayback();
    useSimulationStore.getState().setPlaybackIndex(1);
    useSimulationStore.getState().advancePlayback();
    expect(useSimulationStore.getState().isPlaying).toBe(false);
  });
});

describe('mode', () => {
  test('initial mode is VIEW', () => {
    expect(useSimulationStore.getState().mode).toBe('VIEW');
  });

  test('setMode changes mode', () => {
    useSimulationStore.getState().setMode('PLACE');
    expect(useSimulationStore.getState().mode).toBe('PLACE');
    useSimulationStore.getState().setMode('EDIT');
    expect(useSimulationStore.getState().mode).toBe('EDIT');
    useSimulationStore.getState().setMode('REPLAY');
    expect(useSimulationStore.getState().mode).toBe('REPLAY');
  });

  test('addRCMPoint auto-transitions to EDIT mode', () => {
    useSimulationStore.getState().setMode('PLACE');
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    expect(useSimulationStore.getState().mode).toBe('EDIT');
  });

  test('reset returns mode to VIEW', () => {
    useSimulationStore.getState().setMode('EDIT');
    useSimulationStore.getState().reset();
    expect(useSimulationStore.getState().mode).toBe('VIEW');
  });
});
