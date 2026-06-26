import { useSimulationStore } from '../../stores/simulationStore';
import { useNeedlePose } from '../../hooks/useNeedlePose';
import { usePhaseTransitionFlash } from '../../hooks/usePhaseTransition';

const phaseColorMap: Record<string, string> = {
  IDLE: 'text-gray-400',
  CONTACT: 'text-blue-400',
  INSERTING: 'text-green-400',
  WITHDRAWING: 'text-amber-400',
  COMPLETE: 'text-red-400',
};

export function KinematicsPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const isPhaseTransitioning = usePhaseTransitionFlash();
  const pose = useNeedlePose();

  return (
    <div className="pointer-events-auto w-full rounded-lg border border-blue-500/30 bg-gray-950/85 p-3 text-blue-100 backdrop-blur sm:min-w-[240px] sm:p-4">
      <h3 className="mb-2 border-b border-blue-500/20 pb-1 text-xs font-semibold tracking-wider text-blue-400 uppercase sm:mb-3 sm:text-sm">
        Kinematics
      </h3>
      {pose ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Phase</td>
              <td className="py-1 text-right">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold tracking-wider transition-all duration-300 ${
                    phaseColorMap[phase] ?? 'text-blue-100'
                  } ${
                    isPhaseTransitioning
                      ? 'scale-110 shadow-lg shadow-blue-500/50 animate-pulse'
                      : ''
                  }`}
                >
                  {phase}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip X</td>
              <td className="py-1 text-right font-mono text-xs">
                {pose.tipPosition[0].toFixed(2)} mm
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip Y</td>
              <td className="py-1 text-right font-mono text-xs">
                {pose.tipPosition[1].toFixed(2)} mm
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tip Z</td>
              <td className="py-1 text-right font-mono text-xs">
                {pose.tipPosition[2].toFixed(2)} mm
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Insertion</td>
              <td className="py-1 text-right font-mono text-xs">
                {pose.insertionDepth.toFixed(2)} mm
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tilt Alpha</td>
              <td className="py-1 text-right font-mono text-xs">
                {(pose.tiltAlpha * (180 / Math.PI)).toFixed(1)} deg
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-blue-300/70">Tilt Beta</td>
              <td className="py-1 text-right font-mono text-xs">
                {(pose.tiltBeta * (180 / Math.PI)).toFixed(1)} deg
              </td>
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
        <p className="text-sm text-blue-300/50 italic">Click on the eyeball to place the needle</p>
      )}
    </div>
  );
}
