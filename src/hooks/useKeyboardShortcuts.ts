import { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MAX_TILT_ANGLE } from '../constants';

/**
 * Registers global keyboard shortcuts for the simulation.
 * - R: Reset
 * - C: Clear trails
 * - Arrow keys: Adjust insertion depth and tilt angles
 * - 1-4: Preset tilt angles (0/15/30/45deg)
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const store = useSimulationStore.getState();
      switch (e.key) {
        case 'r':
        case 'R':
          store.reset();
          break;
        case 'c':
        case 'C':
          store.clearTrails();
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.setInsertionDepth(store.insertionDepth + 0.5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          store.setInsertionDepth(store.insertionDepth - 0.5);
          break;
        case 'ArrowLeft':
          store.setTiltAngles(store.tiltAlpha, store.tiltBeta - 0.05);
          break;
        case 'ArrowRight':
          store.setTiltAngles(store.tiltAlpha, store.tiltBeta + 0.05);
          break;
        case '1':
          store.setTiltAngles(0, 0);
          break;
        case '2':
          store.setTiltAngles(Math.PI / 12, 0);
          break;
        case '3':
          store.setTiltAngles(Math.PI / 6, 0);
          break;
        case '4':
          store.setTiltAngles(MAX_TILT_ANGLE, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, []);
}
