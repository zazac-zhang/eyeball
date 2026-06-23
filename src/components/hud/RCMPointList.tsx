import { useSimulationStore } from '../../stores/simulationStore';
import type { RCMPoint } from '../../stores/simulationStore';

export function RCMPointList() {
  const rcmPoints = useSimulationStore((s) => s.rcmPoints);
  const currentRCMIndex = useSimulationStore((s) => s.currentRCMIndex);
  const setCurrentRCMIndex = useSimulationStore((s) => s.setCurrentRCMIndex);
  const removeRCMPoint = useSimulationStore((s) => s.removeRCMPoint);
  const mode = useSimulationStore((s) => s.mode);

  if (rcmPoints.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute top-4 left-1/2 z-10 min-w-[200px] -translate-x-1/2 rounded-lg border border-blue-500/30 bg-gray-950/85 p-3 text-blue-100 backdrop-blur">
      <h4 className="mb-2 border-b border-blue-500/20 pb-1 text-sm font-semibold text-blue-400">RCM Points</h4>
      <div className="space-y-1">
        {rcmPoints.map((rcm: RCMPoint, index: number) => (
          <div
            key={rcm.id}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
              index === currentRCMIndex
                ? 'bg-blue-500/20 text-blue-100'
                : 'bg-blue-500/5 text-blue-300/70 hover:bg-blue-500/10'
            }`}
          >
            <button
              onClick={() => {
                setCurrentRCMIndex(index);
              }}
              className="flex-1 text-left"
            >
              <div className="font-mono text-[10px]">
                RCM {index + 1}
              </div>
              <div className="font-mono text-[9px] text-blue-300/60">
                [{rcm.point[0].toFixed(1)}, {rcm.point[1].toFixed(1)}, {rcm.point[2].toFixed(1)}]
              </div>
            </button>
            <button
              onClick={() => {
                removeRCMPoint(index);
              }}
              disabled={mode === 'EDIT' && rcmPoints.length === 1}
              className="ml-2 rounded px-1.5 py-0.5 text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove RCM point"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-blue-500/20 pt-2 text-[10px] text-blue-300/60">
        {rcmPoints.length} RCM point{rcmPoints.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
