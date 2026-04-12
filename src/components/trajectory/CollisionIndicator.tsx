import { useCollisionDetection } from '../../hooks/useCollisionDetection';
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Visual feedback when needle tip collides with eyeball surface.
 *
 * Displays a glowing ring at the collision point and changes color
 * based on proximity to surface.
 */
export function CollisionIndicator() {
  const { isColliding, collisionPoint, distance } = useCollisionDetection();

  const { color, scale, opacity } = useMemo(() => {
    if (!isColliding) {
      return { color: '#ff4444', scale: 0, opacity: 0 };
    }

    // Interpolate color based on distance (closer = more intense)
    const normalizedDistance = Math.min(distance / 0.5, 1); // 0 = touching, 1 = at threshold
    const intensity = 1 - normalizedDistance;

    // Color gradient: red (close) → yellow (medium) → green (far)
    let r = 1,
      g = 0;
    const b = 0;
    if (normalizedDistance < 0.5) {
      // Red to yellow
      g = normalizedDistance * 2;
    } else {
      // Yellow to green
      r = 1 - (normalizedDistance - 0.5) * 2;
      g = 1;
    }

    return {
      color: `rgb(${String(Math.round(r * 255))}, ${String(Math.round(g * 255))}, ${String(Math.round(b * 255))})`,
      scale: 0.5 + intensity * 0.5, // 0.5 to 1.0
      opacity: 0.3 + intensity * 0.7, // 0.3 to 1.0
    };
  }, [isColliding, distance]);

  if (!isColliding || !collisionPoint) return null;

  return (
    <group position={new THREE.Vector3(...collisionPoint)}>
      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner highlight */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[scale * 0.7, scale * 0.7, scale * 0.7]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
