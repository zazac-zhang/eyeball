import { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useKeyBindingsStore } from '../stores/keyBindingsStore';
import { useActionLogger } from './useActionLogger';
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
  const logAction = useActionLogger().log;

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
          if (store.canRedo) {
            logAction('REDO');
            store.redo();
          }
        } else {
          if (store.canUndo) {
            logAction('UNDO');
            store.undo();
          }
        }
        return;
      }

      if (e.key === kb.redo && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (store.canRedo) {
          logAction('REDO');
          store.redo();
        }
        return;
      }

      // Mode switching (works in any mode)
      if (e.key === kb.modeView || e.key === kb.modeView.toUpperCase()) {
        logAction('MODE_SWITCH', { mode: 'VIEW' });
        store.setMode('VIEW');
        return;
      }
      if (e.key === kb.modePlace || e.key === kb.modePlace.toUpperCase()) {
        if (!rcmPoint) {
          logAction('MODE_SWITCH', { mode: 'PLACE' });
          store.setMode('PLACE');
        }
        return;
      }
      if (e.key === kb.modeEdit || e.key === kb.modeEdit.toUpperCase()) {
        if (rcmPoint) {
          logAction('MODE_SWITCH', { mode: 'EDIT' });
          store.setMode('EDIT');
        }
        return;
      }
      if (e.key === kb.modeReplay || e.key === kb.modeReplay.toUpperCase()) {
        if (trailData.length > 0) {
          logAction('MODE_SWITCH', { mode: 'REPLAY' });
          store.setMode('REPLAY');
        }
        return;
      }

      if (e.key === kb.reset) {
        logAction('RESET');
        store.reset();
      } else if (e.key === kb.clearTrails || e.key === kb.clearTrails.toUpperCase()) {
        logAction('CLEAR_TRAILS');
        store.clearTrails();
      } else if (e.key === kb.insertUp && mode === 'EDIT') {
        e.preventDefault();
        logAction('INSERT_DEPTH', { delta: 0.5, from: store.insertionDepth });
        store.setInsertionDepth(store.insertionDepth + 0.5);
      } else if (e.key === kb.withdrawDown && mode === 'EDIT') {
        e.preventDefault();
        logAction('WITHDRAW_DEPTH', { delta: 0.5, from: store.insertionDepth });
        store.setInsertionDepth(store.insertionDepth - 0.5);
      } else if (e.key === kb.rotateLeft && mode === 'EDIT') {
        logAction('ROTATE_LEFT', { beta: store.tiltBeta });
        store.setTiltAngles(store.tiltAlpha, store.tiltBeta - 0.05);
      } else if (e.key === kb.rotateRight && mode === 'EDIT') {
        logAction('ROTATE_RIGHT', { beta: store.tiltBeta });
        store.setTiltAngles(store.tiltAlpha, store.tiltBeta + 0.05);
      } else if (e.key === kb.preset1 && mode === 'EDIT') {
        logAction('PRESET_ANGLE', { angle: '0deg' });
        store.setTiltAngles(0, 0);
      } else if (e.key === kb.preset2 && mode === 'EDIT') {
        logAction('PRESET_ANGLE', { angle: '15deg' });
        store.setTiltAngles(Math.PI / 12, 0);
      } else if (e.key === kb.preset3 && mode === 'EDIT') {
        logAction('PRESET_ANGLE', { angle: '30deg' });
        store.setTiltAngles(Math.PI / 6, 0);
      } else if (e.key === kb.preset4 && mode === 'EDIT') {
        logAction('PRESET_ANGLE', { angle: '45deg' });
        store.setTiltAngles(MAX_TILT_ANGLE, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyBindings, logAction]);
}
