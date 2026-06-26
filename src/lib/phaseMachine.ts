import { SurgicalPhase } from '../types';
import type { SurgicalPhase as PhaseType } from '../types';

/**
 * Pure state machine for surgical phase transitions.
 *
 * All transition rules live here — no store, no side effects.
 * Auto-transitions (timer-based) remain in useAutoPhaseTransition hook.
 *
 * Transitions:
 *   IDLE → CONTACT    : placeRCM
 *   CONTACT → INSERTING : needleMoved (tilt or depth > 0)
 *   INSERTING → WITHDRAWING : depthReturned (depth → 0)
 *   WITHDRAWING → COMPLETE  : completeSurgery (explicit user action)
 */
export function transitionPhase(
  current: PhaseType,
  event: 'placeRCM' | 'needleMoved' | 'depthReturned' | 'completeSurgery'
): PhaseType {
  switch (current) {
    case SurgicalPhase.IDLE:
      if (event === 'placeRCM') return SurgicalPhase.CONTACT;
      return current;

    case SurgicalPhase.CONTACT:
      if (event === 'needleMoved') return SurgicalPhase.INSERTING;
      return current;

    case SurgicalPhase.INSERTING:
      if (event === 'depthReturned') return SurgicalPhase.WITHDRAWING;
      return current;

    case SurgicalPhase.WITHDRAWING:
      if (event === 'completeSurgery') return SurgicalPhase.COMPLETE;
      return current;

    case SurgicalPhase.COMPLETE:
      return current;

    default:
      return current;
  }
}
