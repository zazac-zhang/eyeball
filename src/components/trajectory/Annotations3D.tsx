import { Html } from '@react-three/drei';
import { useSimulationStore } from '../../stores/simulationStore';

export function Annotations3D() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const mode = useSimulationStore((s) => s.mode);

  if (mode !== 'EDIT' || !rcmPoint) return null;

  return (
    <>
      {/* RCM Point label */}
      <Html
        position={rcmPoint}
        center
        distanceFactor={40}
        className="pointer-events-none select-none"
      >
        <div className="rounded bg-black/80 px-2 py-1 text-xs font-mono text-green-400 whitespace-nowrap backdrop-blur-sm">
          RCM ({rcmPoint.map((v) => v.toFixed(1)).join(', ')})
        </div>
      </Html>

      {/* Surface normal arrow label */}
      {surfaceNormal && (
        <Html
          position={[
            rcmPoint[0] + surfaceNormal[0] * 2,
            rcmPoint[1] + surfaceNormal[1] * 2,
            rcmPoint[2] + surfaceNormal[2] * 2,
          ]}
          center
          distanceFactor={40}
          className="pointer-events-none select-none"
        >
          <div className="rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-blue-300 whitespace-nowrap backdrop-blur-sm">
            N ({surfaceNormal.map((v) => v.toFixed(2)).join(', ')})
          </div>
        </Html>
      )}

      {/* Insertion depth label near needle tip */}
      <Html
        position={[rcmPoint[0], rcmPoint[1], rcmPoint[2] - 3]}
        center
        distanceFactor={40}
        className="pointer-events-none select-none"
      >
        <div className="rounded bg-black/80 px-2 py-1 text-xs font-mono text-amber-400 whitespace-nowrap backdrop-blur-sm">
          Depth: {insertionDepth.toFixed(1)} mm
        </div>
      </Html>
    </>
  );
}
