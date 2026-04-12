import { Html } from '@react-three/drei';
import { useSimulationStore } from '../../stores/simulationStore';
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 3D annotations showing real-time spatial information.
 *
 * Displays:
 * - RCM point coordinates
 * - Needle tip position
 * - Insertion depth
 * - Tilt angles
 *
 * Labels follow 3D objects and remain readable in screen space.
 */
export function ObjectLabels() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const tipPosition = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;

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
    return [tip.x, tip.y, tip.z] as [number, number, number];
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  if (!rcmPoint || !tipPosition) return null;

  return (
    <>
      {/* RCM Point Label */}
      <Html position={new THREE.Vector3(...rcmPoint)} center distanceFactor={8} zIndexRange={[0, 0]}>
        <div className="pointer-events-none rounded bg-blue-950/90 px-2 py-1 text-[10px] text-blue-100 shadow-lg backdrop-blur-sm border border-blue-500/30">
          <div className="font-semibold text-blue-400">RCM Point</div>
          <div className="font-mono">
            [{rcmPoint[0].toFixed(1)}, {rcmPoint[1].toFixed(1)}, {rcmPoint[2].toFixed(1)}]
          </div>
        </div>
      </Html>

      {/* Needle Tip Label */}
      <Html position={new THREE.Vector3(...tipPosition)} center distanceFactor={8} zIndexRange={[0, 0]}>
        <div className="pointer-events-none rounded bg-red-950/90 px-2 py-1 text-[10px] text-red-100 shadow-lg backdrop-blur-sm border border-red-500/30">
          <div className="font-semibold text-red-400">Tip</div>
          <div className="font-mono">
            [{tipPosition[0].toFixed(1)}, {tipPosition[1].toFixed(1)}, {tipPosition[2].toFixed(1)}]
          </div>
          <div className="mt-1 text-red-300">Depth: {insertionDepth.toFixed(1)}mm</div>
        </div>
      </Html>

      {/* Tilt Angles Label */}
      {insertionDepth > 0 && (
        <Html
          position={new THREE.Vector3(...tipPosition).add(new THREE.Vector3(0, 2, 0))}
          center
          distanceFactor={10}
          zIndexRange={[0, 0]}
        >
          <div className="pointer-events-none rounded bg-amber-950/90 px-2 py-1 text-[10px] text-amber-100 shadow-lg backdrop-blur-sm border border-amber-500/30">
            <div className="font-semibold text-amber-400">Tilt</div>
            <div className="font-mono">
              α: {(tiltAlpha * (180 / Math.PI)).toFixed(1)}°
            </div>
            <div className="font-mono">
              β: {(tiltBeta * (180 / Math.PI)).toFixed(1)}°
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
