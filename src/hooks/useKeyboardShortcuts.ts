import { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useKeyBindingsStore } from '../stores/keyBindingsStore';
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
 * - Ctrl+Z: Undo
 * - Ctrl+Shift+Z / Ctrl+Y: Redo
 */
export function useKeyboardShortcuts() {
  const keyBindings = useKeyBindingsStore((s) => s.keyBindings);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const store = useSimulationStore.getState();
      const { mode, rcmPoint, trailData } = store;
      const kb = keyBindings;

      // Undo/Redo (global, but check modifiers first)
      if (e.key === kb.undo && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          if (store.canRedo) {
            store.redo();
          }
        } else {
          // Ctrl+Z = Undo
          if (store.canUndo) {
            store.undo();
          }
        }
        return;
      }

      if (e.key === kb.redo && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (store.canRedo) {
          store.redo();
        }
        return;
      }

      // Mode switching (works in any mode)
      if (e.key === kb.modeView || e.key === kb.modeView.toUpperCase()) {
        store.setMode('VIEW');
        return;
      }
      if (e.key === kb.modePlace || e.key === kb.modePlace.toUpperCase()) {
        if (!rcmPoint) {
          store.setMode('PLACE');
        }
        return;
      }
      if (e.key === kb.modeEdit || e.key === kb.modeEdit.toUpperCase()) {
        if (rcmPoint) {
          store.setMode('EDIT');
        }
        return;
      }
      if (e.key === kb.modeReplay || e.key === kb.modeReplay.toUpperCase()) {
        if (trailData.length > 0) {
          store.setMode('REPLAY');
        }
        return;
      }

      if (e.key === kb.reset) {
        store.reset();
      } else if (e.key === kb.clearTrails || e.key === kb.clearTrails.toUpperCase()) {
        store.clearTrails();
      } else if (e.key === kb.insertUp && mode === 'EDIT') {
        e.preventDefault();
        store.setInsertionDepth(store.insertionDepth + 0.5);
      } else if (e.key === kb.withdrawDown && mode === 'EDIT') {
        e.preventDefault();
        store.setInsertionDepth(store.insertionDepth - 0.5);
      } else if (e.key === kb.rotateLeft && mode === 'EDIT') {
        store.setTiltAngles(store.tiltAlpha, store.tiltBeta - 0.05);
      } else if (e.key === kb.rotateRight && mode === 'EDIT') {
        store.setTiltAngles(store.tiltAlpha, store.tiltBeta + 0.05);
      } else if (e.key === kb.preset1 && mode === 'EDIT') {
        store.setTiltAngles(0, 0);
      } else if (e.key === kb.preset2 && mode === 'EDIT') {
        store.setTiltAngles(Math.PI / 12, 0);
      } else if (e.key === kb.preset3 && mode === 'EDIT') {
        store.setTiltAngles(Math.PI / 6, 0);
      } else if (e.key === kb.preset4 && mode === 'EDIT') {
        store.setTiltAngles(MAX_TILT_ANGLE, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyBindings]);
}
