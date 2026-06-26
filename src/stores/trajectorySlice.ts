import type { StateCreator } from 'zustand';
import type { Vec3, TrailPoint } from '../types';
import type { SimulationState } from './simulationStore';

const MAX_TRAIL_POINTS = 5000;
const MAX_CHART_POINTS = 100;

export interface TrajectorySlice {
  trailPoints: Vec3[];
  trailData: TrailPoint[];
  chartData: Array<{ timestamp: number; depth: number }>;
  isPlaying: boolean;
  playbackSpeed: number;
  playbackIndex: number;

  addTrailPoint: (point: Vec3, tiltAlpha: number, tiltBeta: number, insertionDepth: number) => void;
  importTrailData: (data: TrailPoint[]) => void;
  clearTrails: () => void;
  addChartDataPoint: (depth: number) => void;
  clearChartData: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackIndex: (index: number) => void;
  advancePlayback: () => void;
}

export const createTrajectorySlice: StateCreator<SimulationState, [], [], TrajectorySlice> = (set, get) => ({
  trailPoints: [],
  trailData: [],
  chartData: [],
  isPlaying: false,
  playbackSpeed: 1,
  playbackIndex: 0,

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

  addChartDataPoint: (depth) => {
    set((state) => {
      const newPoint = { timestamp: Date.now(), depth };
      const newChartData = [...state.chartData, newPoint];
      if (newChartData.length > MAX_CHART_POINTS) {
        newChartData.splice(0, newChartData.length - MAX_CHART_POINTS);
      }
      return { chartData: newChartData };
    });
  },

  clearChartData: () => {
    set({ chartData: [] });
  },

  clearTrails: () => {
    set({ trailPoints: [], trailData: [], chartData: [] });
  },

  importTrailData: (data) => {
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
});
