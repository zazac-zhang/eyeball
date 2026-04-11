import { useRef, useCallback } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useSimulationStore } from '../stores/simulationStore';
import { computeRCMFromRay } from '../lib/rcm';
import { EYEBALL_RADIUS, MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';
import type { Vec3 } from '../types';

/**
 * Handles mouse/pointer interaction on the eyeball:
 * - Click to place RCM point
 * - Drag to adjust tilt angles (alpha/beta)
 * - Scroll to adjust insertion depth
 *
 * Returns event handlers to spread on a Three.js sphere mesh.
 */
export function useMouseControl() {
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const setRCMPoint = useSimulationStore((s) => s.setRCMPoint);
  const setTiltAngles = useSimulationStore((s) => s.setTiltAngles);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const setIsDragging = useSimulationStore((s) => s.setIsDraggingNeedle);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const rcmPointSet = !!rcmPoint;

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (rcmPointSet) return;

      const rayOrigin: Vec3 = [e.ray.origin.x, e.ray.origin.y, e.ray.origin.z];
      const rayDir: Vec3 = [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z];
      const result = computeRCMFromRay(rayOrigin, rayDir, [0, 0, 0], EYEBALL_RADIUS);
      if (!result) return;

      setRCMPoint(result.rcmPoint, result.surfaceNormal);
    },
    [rcmPointSet, setRCMPoint]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!rcmPointSet) return;
      if (e.button !== 0) return;
      isDragging.current = true;
      setIsDragging(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    },
    [rcmPointSet, setIsDragging]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current || !rcmPointSet) return;
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
    [rcmPointSet, tiltAlpha, tiltBeta, setTiltAngles]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    setIsDragging(false);
  }, [setIsDragging]);

  const handleWheel = useCallback(
    (e: ThreeEvent<WheelEvent>) => {
      if (!rcmPointSet) return;
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      const current = useSimulationStore.getState().insertionDepth;
      setInsertionDepth(Math.max(0, Math.min(current + delta, MAX_INSERTION_DEPTH)));
    },
    [rcmPointSet, setInsertionDepth]
  );

  return { handleClick, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel };
}
