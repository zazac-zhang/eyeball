import { useMemo } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { computeNeedlePose, type RCMConfig } from '../../lib/rcm';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';

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
    <div className="hud-panel">
      <h3>Kinematics</h3>
      {pose ? (
        <table>
          <tbody>
            <tr>
              <td className="label">Phase</td>
              <td className="value">{phase}</td>
            </tr>
            <tr>
              <td className="label">Tip X</td>
              <td className="value">{pose.tipPosition[0].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="label">Tip Y</td>
              <td className="value">{pose.tipPosition[1].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="label">Tip Z</td>
              <td className="value">{pose.tipPosition[2].toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="label">Insertion</td>
              <td className="value">{pose.insertionDepth.toFixed(2)} mm</td>
            </tr>
            <tr>
              <td className="label">Tilt Alpha</td>
              <td className="value">{(pose.tiltAlpha * (180 / Math.PI)).toFixed(1)} deg</td>
            </tr>
            <tr>
              <td className="label">Tilt Beta</td>
              <td className="value">{(pose.tiltBeta * (180 / Math.PI)).toFixed(1)} deg</td>
            </tr>
            {rcmPoint && (
              <tr>
                <td className="label">RCM</td>
                <td className="value">
                  [{rcmPoint[0].toFixed(1)}, {rcmPoint[1].toFixed(1)}, {rcmPoint[2].toFixed(1)}]
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p className="hint">Click on the eyeball to place the needle</p>
      )}
    </div>
  );
}
