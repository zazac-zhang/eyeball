import { useMemo } from 'react';
import { useNeedlePose } from './useNeedlePose';
import { EYEBALL_RADIUS } from '../constants';
import type { Vec3 } from '../types';

/**
 * Detects collision between needle tip and eyeball surface.
 *
 * Derives tip position from useNeedlePose() — no duplicate direction math.
 *
 * Returns:
 * - isColliding: true if tip is within threshold distance of surface
 * - collisionPoint: the point on the sphere surface closest to the tip
 * - distance: distance from tip to surface
 */
export function useCollisionDetection() {
  const pose = useNeedlePose();

  const collision = useMemo(() => {
    if (!pose) {
      return { isColliding: false, collisionPoint: null as Vec3 | null, distance: Infinity };
    }

    const tip = pose.tipPosition;
    const distanceFromCenter = Math.sqrt(tip[0] * tip[0] + tip[1] * tip[1] + tip[2] * tip[2]);

    const threshold = 0.5; // 0.5mm threshold for visual feedback
    const distanceToSurface = Math.abs(distanceFromCenter - EYEBALL_RADIUS);
    const isColliding = distanceToSurface <= threshold;

    // Closest point on sphere surface
    const norm = distanceFromCenter > 1e-10 ? EYEBALL_RADIUS / distanceFromCenter : 0;
    const collisionPoint: Vec3 = [tip[0] * norm, tip[1] * norm, tip[2] * norm];

    return { isColliding, collisionPoint, distance: distanceToSurface };
  }, [pose]);

  return collision;
}
