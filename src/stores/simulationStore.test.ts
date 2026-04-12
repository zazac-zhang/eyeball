import { expect, test, describe, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore';
import { SurgicalPhase } from '../types';
import type { Vec3 } from '../types';

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

describe('undo/redo', () => {
  test('undo restores previous state', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0.3, 0.5);
    useSimulationStore.getState().saveToHistory();
    useSimulationStore.getState().setTiltAngles(0.6, 1.0);

    expect(useSimulationStore.getState().tiltAlpha).toBeCloseTo(0.6);
    expect(useSimulationStore.getState().canUndo).toBe(true);

    useSimulationStore.getState().undo();

    expect(useSimulationStore.getState().tiltAlpha).toBeCloseTo(0.3);
    expect(useSimulationStore.getState().canUndo).toBe(true);
    expect(useSimulationStore.getState().canRedo).toBe(true);
  });

  test('redo re-applies undone state', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    // addRCMPoint saves history (depth=0, index=0)
    useSimulationStore.getState().setInsertionDepth(5);
    useSimulationStore.getState().saveToHistory(); // index=1, depth=5
    useSimulationStore.getState().setInsertionDepth(10);
    useSimulationStore.getState().saveToHistory(); // index=2, depth=10

    // First undo: restores history[2]=10, index becomes 1
    useSimulationStore.getState().undo();
    // Second undo: restores history[1]=5, index becomes 0
    useSimulationStore.getState().undo();
    expect(useSimulationStore.getState().insertionDepth).toBe(5);
    expect(useSimulationStore.getState().canRedo).toBe(true);

    useSimulationStore.getState().redo();
    // Redo: restores history[1]=5, index becomes 1
    expect(useSimulationStore.getState().insertionDepth).toBe(5);
    expect(useSimulationStore.getState().canUndo).toBe(true);
    expect(useSimulationStore.getState().canRedo).toBe(true);

    useSimulationStore.getState().redo();
    // Redo: restores history[2]=10, index becomes 2
    expect(useSimulationStore.getState().insertionDepth).toBe(10);
    expect(useSimulationStore.getState().canRedo).toBe(false);
  });

  test('undo does nothing when historyIndex < 0', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().undo();
    expect(useSimulationStore.getState().historyIndex).toBe(-1);
  });

  test('redo does nothing when at end of history', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().redo();
    expect(useSimulationStore.getState().historyIndex).toBe(0);
  });

  test('new action clears future redo history', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setInsertionDepth(5);
    useSimulationStore.getState().saveToHistory();
    useSimulationStore.getState().setInsertionDepth(10);
    useSimulationStore.getState().saveToHistory();
    useSimulationStore.getState().undo();
    expect(useSimulationStore.getState().canRedo).toBe(true);

    // New action should clear redo
    useSimulationStore.getState().setInsertionDepth(15);
    useSimulationStore.getState().saveToHistory();

    expect(useSimulationStore.getState().canRedo).toBe(false);
  });
});

describe('multi-RCM management', () => {
  test('removeRCMPoint removes point and adjusts index', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().addRCMPoint([1, 0, 12], [0.1, 0, 1]);
    expect(useSimulationStore.getState().rcmPoints).toHaveLength(2);

    useSimulationStore.getState().removeRCMPoint(0);

    expect(useSimulationStore.getState().rcmPoints).toHaveLength(1);
    expect(useSimulationStore.getState().currentRCMIndex).toBe(0);
  });

  test('removeRCMPoint when removing current point sets index to -1 if no other points', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().addRCMPoint([1, 0, 12], [0.1, 0, 1]);
    expect(useSimulationStore.getState().currentRCMIndex).toBe(1);

    useSimulationStore.getState().removeRCMPoint(1);

    // When removing the current point, index goes to -1 (no current)
    // But finalIndex = Math.min(-1, 0) = -1 when there's still one point left
    expect(useSimulationStore.getState().rcmPoints).toHaveLength(1);
    expect(useSimulationStore.getState().currentRCMIndex).toBe(-1);
  });

  test('removeRCMPoint transitions to IDLE when last point removed', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.CONTACT);

    useSimulationStore.getState().removeRCMPoint(0);

    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.IDLE);
    expect(useSimulationStore.getState().rcmPoint).toBeNull();
  });

  test('setCurrentRCMIndex updates current point', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().addRCMPoint([1, 0, 12], [0.1, 0, 1]);

    useSimulationStore.getState().setCurrentRCMIndex(0);

    expect(useSimulationStore.getState().currentRCMIndex).toBe(0);
    expect(useSimulationStore.getState().rcmPoint).toEqual([0, 0, 12]);
  });

  test('updateRCMPoint modifies existing point', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);

    useSimulationStore.getState().updateRCMPoint(0, [2, 2, 10], [0.2, 0.2, 0.9]);

    expect(useSimulationStore.getState().rcmPoints[0].point).toEqual([2, 2, 10]);
    expect(useSimulationStore.getState().rcmPoint).toEqual([2, 2, 10]);
  });
});

describe('chartData', () => {
  test('addChartDataPoint records depth with timestamp', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addChartDataPoint(5.0);

    expect(useSimulationStore.getState().chartData).toHaveLength(1);
    expect(useSimulationStore.getState().chartData[0].depth).toBe(5.0);
    expect(useSimulationStore.getState().chartData[0].timestamp).toBeGreaterThan(0);
  });

  test('chartData is capped at MAX_CHART_POINTS', () => {
    useSimulationStore.getState().reset();
    for (let i = 0; i < 150; i++) {
      useSimulationStore.getState().addChartDataPoint(i);
    }

    expect(useSimulationStore.getState().chartData).toHaveLength(100);
  });

  test('clearChartData removes all chart data', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addChartDataPoint(5.0);
    expect(useSimulationStore.getState().chartData).toHaveLength(1);

    useSimulationStore.getState().clearChartData();

    expect(useSimulationStore.getState().chartData).toEqual([]);
  });
});

describe('importTrailData', () => {
  test('imports trail data and sets playback ready', () => {
    const trailData = [
      { tipPosition: [0, 0, 12] as Vec3, tiltAlpha: 0, tiltBeta: 0, insertionDepth: 0, timestamp: Date.now() },
      { tipPosition: [1, 1, 11] as Vec3, tiltAlpha: 0.1, tiltBeta: 0.1, insertionDepth: 5, timestamp: Date.now() },
    ];

    useSimulationStore.getState().importTrailData(trailData);

    const state = useSimulationStore.getState();
    expect(state.trailData).toHaveLength(2);
    expect(state.trailPoints).toHaveLength(2);
    expect(state.playbackIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  test('truncates trailData to MAX_TRAIL_POINTS', () => {
    const trailData = Array.from({ length: 6000 }, (_, i) => ({
      tipPosition: [i, 0, 12] as Vec3,
      tiltAlpha: 0,
      tiltBeta: 0,
      insertionDepth: 0,
      timestamp: Date.now(),
    }));

    useSimulationStore.getState().importTrailData(trailData);

    expect(useSimulationStore.getState().trailData).toHaveLength(5000);
  });
});

describe('getNeedlePose', () => {
  test('returns null when no RCM point', () => {
    useSimulationStore.getState().reset();
    expect(useSimulationStore.getState().getNeedlePose()).toBeNull();
  });

  test('returns needle pose when RCM point exists', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0, 0);
    useSimulationStore.getState().setInsertionDepth(5);

    const pose = useSimulationStore.getState().getNeedlePose();

    expect(pose).not.toBeNull();
    expect(pose?.tipPosition).toBeDefined();
  });
});

describe('isDraggingRCM', () => {
  test('setIsDraggingRCM updates flag', () => {
    useSimulationStore.getState().reset();
    expect(useSimulationStore.getState().isDraggingRCM).toBe(false);

    useSimulationStore.getState().setIsDraggingRCM(true);
    expect(useSimulationStore.getState().isDraggingRCM).toBe(true);

    useSimulationStore.getState().setIsDraggingRCM(false);
    expect(useSimulationStore.getState().isDraggingRCM).toBe(false);
  });
});

describe('setPhase', () => {
  test('setPhase directly changes phase', () => {
    useSimulationStore.getState().reset();
    useSimulationStore.getState().setPhase(SurgicalPhase.INSERTING);
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.INSERTING);
  });
});
