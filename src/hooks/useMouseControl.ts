import { useRef } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useSimulationStore } from '../stores/simulationStore';
import { computeRCMFromRay } from '../lib/rcm';
import { EYEBALL_RADIUS, MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../constants';
import { useActionLogger } from './useActionLogger';
import type { Vec3 } from '../types';

/**
 * Handles mouse/pointer interaction on the eyeball, gated by simulation mode:
 * - VIEW: all handlers are no-ops (OrbitControls handles camera)
 * - PLACE: click places RCM point, drag to move existing RCM
 * - EDIT: drag adjusts tilt angles, scroll adjusts insertion depth
 * - REPLAY: all handlers are no-ops (OrbitControls handles camera)
 */
export function useMouseControl() {
  const isDragging = useRef(false);
  const isDraggingRCM = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const logAction = useActionLogger().log;

  const mode = useSimulationStore((s) => s.mode);
  const addRCMPoint = useSimulationStore((s) => s.addRCMPoint);
  const updateRCMPoint = useSimulationStore((s) => s.updateRCMPoint);
  const setIsDraggingRCM = useSimulationStore((s) => s.setIsDraggingRCM);
  const setTiltAngles = useSimulationStore((s) => s.setTiltAngles);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const rcmPointSet = !!rcmPoint;
  const currentRCMIndex = useSimulationStore((s) => s.currentRCMIndex);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (mode !== 'PLACE') return;

    const rayOrigin: Vec3 = [e.ray.origin.x, e.ray.origin.y, e.ray.origin.z];
    const rayDir: Vec3 = [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z];
    const result = computeRCMFromRay(rayOrigin, rayDir, [0, 0, 0], EYEBALL_RADIUS);
    if (!result) return;

    e.stopPropagation();
    logAction('RCM_PLACED', {
      point: result.rcmPoint,
      normal: result.surfaceNormal,
    });
    addRCMPoint(result.rcmPoint, result.surfaceNormal);
  }

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    // EDIT mode: drag to adjust tilt angles
    if (mode === 'EDIT' && rcmPointSet && e.button === 0) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // PLACE mode with existing RCM: start dragging RCM point
    if (mode === 'PLACE' && rcmPointSet && e.button === 0) {
      isDraggingRCM.current = true;
      setIsDraggingRCM(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.stopPropagation();
      return;
    }
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    // EDIT mode: dragging adjusts tilt angles
    if (mode === 'EDIT' && isDragging.current && rcmPointSet) {
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
      return;
    }

    // PLACE mode: dragging moves RCM point
    if (mode === 'PLACE' && isDraggingRCM.current) {
      e.stopPropagation();
      const rayOrigin: Vec3 = [e.ray.origin.x, e.ray.origin.y, e.ray.origin.z];
      const rayDir: Vec3 = [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z];
      const result = computeRCMFromRay(rayOrigin, rayDir, [0, 0, 0], EYEBALL_RADIUS);
      if (result) {
        updateRCMPoint(currentRCMIndex, result.rcmPoint, result.surfaceNormal);
      }
      return;
    }
  }

  function handlePointerUp() {
    const store = useSimulationStore.getState();

    if (isDraggingRCM.current) {
      isDraggingRCM.current = false;
      setIsDraggingRCM(false);
      // Save history after RCM drag completes
      requestAnimationFrame(() => {
        store.saveToHistory();
      });
    }

    if (isDragging.current) {
      isDragging.current = false;
      // Save history after tilt adjustment completes
      requestAnimationFrame(() => {
        store.saveToHistory();
      });
    }
  }

  function handleWheel(e: ThreeEvent<WheelEvent>) {
    if (mode !== 'EDIT' || !rcmPointSet) return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    const current = useSimulationStore.getState().insertionDepth;
    setInsertionDepth(Math.max(0, Math.min(current + delta, MAX_INSERTION_DEPTH)));
  }

  return { handleClick, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel };
}
