import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { COLORS } from '../../constants';

/**
 * NormalIndicator: shows the surface normal direction at the RCM point.
 *
 * The normal is the direction perpendicular to the eyeball surface at the
 * point where the needle first contacts. This is the axis along which the
 * needle can tilt (pivot around the RCM point).
 *
 * Visual: a yellow arrow pointing outward from the RCM point.
 */
export function NormalIndicator() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);

  const helper = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;

    const direction = new THREE.Vector3(...surfaceNormal).normalize();
    const origin = new THREE.Vector3(...rcmPoint);
    const length = 4; // Arrow length in mm
    const hex = COLORS.rcmIndicator; // Yellow color
    const headLength = 0.8;
    const headWidth = 0.5;

    return new THREE.ArrowHelper(direction, origin, length, hex, headLength, headWidth);
  }, [rcmPoint, surfaceNormal]);

  if (!helper) return null;

  return <primitive object={helper} />;
}
