import { useRef, useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MAX_INSERTION_DEPTH } from '../constants';

/**
 * Handles touch pinch-to-zoom gestures for adjusting insertion depth on mobile devices.
 * Two-finger pinch gesture adjusts the needle insertion depth.
 */
export function useTouchPinch() {
  const mode = useSimulationStore((s) => s.mode);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);

  const initialPinchDistance = useRef<number | null>(null);
  const initialDepth = useRef<number>(0);

  function getPinchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleTouchStart(e: TouchEvent) {
    if (mode !== 'EDIT' || !rcmPoint) return;
    if (e.touches.length === 2) {
      initialPinchDistance.current = getPinchDistance(e.touches);
      initialDepth.current = useSimulationStore.getState().insertionDepth;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (mode !== 'EDIT' || !rcmPoint) return;
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      e.preventDefault();
      const currentDistance = getPinchDistance(e.touches);
      const delta = (currentDistance - initialPinchDistance.current) / 50;
      const newDepth = Math.max(0, Math.min(initialDepth.current + delta, MAX_INSERTION_DEPTH));
      setInsertionDepth(newDepth);
    }
  }

  function handleTouchEnd() {
    initialPinchDistance.current = null;
  }

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  });
}
