import { useRef, useCallback } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useSimulationStore } from '../stores/simulationStore';
import { computeRCMFromRay } from '../lib/rcm';
import { EYEBALL_RADIUS, MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';
import type { Vec3 } from '../types';

/**
 * Handles mouse/pointer interaction on the eyeball, gated by simulation mode:
 * - VIEW: all handlers are no-ops (OrbitControls handles camera)
 * - PLACE: click places RCM point, then auto-switches to EDIT
 * - EDIT: drag adjusts tilt angles, scroll adjusts insertion depth
 * - REPLAY: all handlers are no-ops (OrbitControls handles camera)
 */
export function useMouseControl() {
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const mode = useSimulationStore((s) => s.mode);
  const setRCMPoint = useSimulationStore((s) => s.setRCMPoint);
  const setTiltAngles = useSimulationStore((s) => s.setTiltAngles);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const rcmPointSet = !!rcmPoint;

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (mode !== 'PLACE') return;

      const rayOrigin: Vec3 = [e.ray.origin.x, e.ray.origin.y, e.ray.origin.z];
      const rayDir: Vec3 = [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z];
      const result = computeRCMFromRay(rayOrigin, rayDir, [0, 0, 0], EYEBALL_RADIUS);
      if (!result) return;

      e.stopPropagation();
      setRCMPoint(result.rcmPoint, result.surfaceNormal);
    },
    [mode, setRCMPoint]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (mode !== 'EDIT' || !rcmPointSet) return;
      if (e.button !== 0) return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    },
    [mode, rcmPointSet]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (mode !== 'EDIT' || !isDragging.current || !rcmPointSet) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.005;
      const newBeta = tiltBeta + dx * sensitivity;
      const newAlpha = Math.max(
        -MAX_TILT_ANGLE,
        Math.min(MAX_TILT_ANGLE, tiltAlpha + dy * sensitivity)
      );
      setTiltAngles(newAlpha, newBeta);
    },
    [mode, rcmPointSet, tiltAlpha, tiltBeta, setTiltAngles]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: ThreeEvent<WheelEvent>) => {
      if (mode !== 'EDIT' || !rcmPointSet) return;
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      const current = useSimulationStore.getState().insertionDepth;
      setInsertionDepth(Math.max(0, Math.min(current + delta, MAX_INSERTION_DEPTH)));
    },
    [mode, rcmPointSet, setInsertionDepth]
  );

  return { handleClick, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel };
}
