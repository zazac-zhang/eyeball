import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../stores/simulationStore';
import { EYEBALL_RADIUS } from '../constants';

/**
 * Detects collision between needle tip and eyeball surface.
 *
 * Returns:
 * - isColliding: true if tip is within threshold distance of surface
 * - collisionPoint: the point on the sphere surface closest to the tip
 * - distance: distance from tip to surface
 */
export function useCollisionDetection() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const collision = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) {
      return { isColliding: false, collisionPoint: null, distance: Infinity };
    }

    // Compute needle direction from tilt angles
    const normal = new THREE.Vector3(...surfaceNormal);
    const up = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3().crossVectors(normal, up).normalize();

    // Rotation around normal (beta) and elevation (alpha)
    const direction = normal.clone();
    direction.applyAxisAngle(right, tiltAlpha);
    direction.applyAxisAngle(normal, tiltBeta);

    // Tip position = RCM point + depth * direction
    const tip = new THREE.Vector3(...rcmPoint).add(direction.clone().multiplyScalar(insertionDepth));

    // Distance from center
    const distanceFromCenter = tip.length();

    // Check if tip is at or near surface (with small threshold)
    const threshold = 0.5; // 0.5mm threshold for visual feedback
    const distanceToSurface = Math.abs(distanceFromCenter - EYEBALL_RADIUS);
    const isColliding = distanceToSurface <= threshold;

    // Find closest point on sphere surface
    const collisionPoint = tip.clone().normalize().multiplyScalar(EYEBALL_RADIUS);

    return {
      isColliding,
      collisionPoint: [collisionPoint.x, collisionPoint.y, collisionPoint.z] as [number, number, number],
      distance: distanceToSurface,
    };
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  return collision;
}
