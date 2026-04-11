import { useMemo } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';

const phaseColorMap: Record<string, string> = {
  IDLE: 'text-gray-400',
  CONTACT: 'text-blue-400',
  INSERTING: 'text-green-400',
  WITHDRAWING: 'text-amber-400',
  COMPLETE: 'text-red-400',
};

export function KinematicsPanel() {
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const phase = useSimulationStore((s) => s.phase);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);

  const pose = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;
    const config: RCMConfig = {
      rcmPoint,
      surfaceNormal,
      maxInsertionDepth: MAX_INSERTION_DEPTH,
      maxTiltAngle: MAX_TILT_ANGLE,
    };
    return computeNeedlePose(config, tiltAlpha, tiltBeta, insertionDepth);
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  return (
    <div className="pointer-events-auto min-w-[240px] rounded-lg border border-blue-500/30 bg-gray-950/85 p-4 text-blue-100 backdrop-blur">
      <h3 className="mb-3 border-b border-blue-500/20 pb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
        Kinematics
      </h3>
      {pose ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Phase</td>
              <td className={`py-1 text-right font-mono text-xs ${phaseColorMap[phase] ?? 'text-blue-100'}`}>
                {phase}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip X</td>
              <td className="py-1 text-right font-mono text-xs">{pose.tipPosition[0].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip Y</td>
              <td className="py-1 text-right font-mono text-xs">{pose.tipPosition[1].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip Z</td>
              <td className="py-1 text-right font-mono text-xs">{pose.tipPosition[2].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Insertion</td>
              <td className="py-1 text-right font-mono text-xs">{pose.insertionDepth.toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tilt Alpha</td>
              <td className="py-1 text-right font-mono text-xs">{(pose.tiltAlpha * (180 / Math.PI)).toFixed(1)} deg</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tilt Beta</td>
              <td className="py-1 text-right font-mono text-xs">{(pose.tiltBeta * (180 / Math.PI)).toFixed(1)} deg</td>
            </tr>
            {rcmPoint && (
              <tr>
                <td className="py-1 pr-3 text-blue-300/70">RCM</td>
                <td className="py-1 text-right font-mono text-xs">
                  [{rcmPoint[0].toFixed(1)}, {rcmPoint[1].toFixed(1)}, {rcmPoint[2].toFixed(1)}]
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p className="text-sm italic text-blue-300/50">Click on the eyeball to place the needle</p>
      )}
    </div>
  );
}
