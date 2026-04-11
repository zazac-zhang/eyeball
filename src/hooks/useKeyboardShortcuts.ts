import { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MAX_TILT_ANGLE } from '../constants';

/**
 * Registers global keyboard shortcuts for the simulation, gated by current mode.
 *
 * Mode switching:
 * - V: VIEW mode (free observation)
 * - P: PLACE mode (place RCM point on eyeball)
 * - E: EDIT mode (adjust needle parameters, requires RCM placed)
 * - R: REPLAY mode (playback trajectory, requires trail data)
 *
 * Other shortcuts (only active in EDIT mode):
 * - Arrow Up/Down: Insert/withdraw 0.5mm
 * - Arrow Left/Right: Rotate azimuth
 * - 1-4: Preset tilt angles (0°/15°/30°/45°)
 *
 * Global shortcuts (any mode):
 * - Escape: Reset simulation to initial state
 * - C: Clear trails
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const store = useSimulationStore.getState();
      const { mode, rcmPoint, trailData } = store;

      // Mode switching (works in any mode)
      switch (e.key) {
        case 'v':
        case 'V':
          store.setMode('VIEW');
          return;
        case 'p':
        case 'P':
          if (!rcmPoint) {
            store.setMode('PLACE');
          }
          return;
        case 'e':
        case 'E':
          if (rcmPoint) {
            store.setMode('EDIT');
          }
          return;
        case 'r':
        case 'R':
          if (trailData.length > 0) {
            store.setMode('REPLAY');
          }
          return;
      }

      switch (e.key) {
        case 'Escape':
          store.reset();
          break;
        case 'c':
        case 'C':
          store.clearTrails();
          break;

        // Below shortcuts only work in EDIT mode
        case 'ArrowUp':
          if (mode !== 'EDIT') return;
          e.preventDefault();
          store.setInsertionDepth(store.insertionDepth + 0.5);
          break;
        case 'ArrowDown':
          if (mode !== 'EDIT') return;
          e.preventDefault();
          store.setInsertionDepth(store.insertionDepth - 0.5);
          break;
        case 'ArrowLeft':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(store.tiltAlpha, store.tiltBeta - 0.05);
          break;
        case 'ArrowRight':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(store.tiltAlpha, store.tiltBeta + 0.05);
          break;
        case '1':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(0, 0);
          break;
        case '2':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(Math.PI / 12, 0);
          break;
        case '3':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(Math.PI / 6, 0);
          break;
        case '4':
          if (mode !== 'EDIT') return;
          store.setTiltAngles(MAX_TILT_ANGLE, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
