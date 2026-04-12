import { useSimulationStore } from '../../stores/simulationStore';
import type { SimulationMode } from '../../types';

interface ModeConfig {
  mode: SimulationMode;
  label: string;
  shortcut: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const MODES: ModeConfig[] = [
  {
    mode: 'VIEW',
    label: 'View',
    shortcut: 'V',
    activeBg: 'bg-blue-600',
    activeBorder: 'border-blue-400',
    activeText: 'text-white',
  },
  {
    mode: 'PLACE',
    label: 'Place',
    shortcut: 'P',
    activeBg: 'bg-green-600',
    activeBorder: 'border-green-400',
    activeText: 'text-white',
  },
  {
    mode: 'EDIT',
    label: 'Edit',
    shortcut: 'E',
    activeBg: 'bg-amber-600',
    activeBorder: 'border-amber-400',
    activeText: 'text-white',
  },
  {
    mode: 'REPLAY',
    label: 'Replay',
    shortcut: 'R',
    activeBg: 'bg-purple-600',
    activeBorder: 'border-purple-400',
    activeText: 'text-white',
  },
];

export function ModePanel() {
  const mode = useSimulationStore((s) => s.mode);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const trailData = useSimulationStore((s) => s.trailData);
  const setMode = useSimulationStore((s) => s.setMode);

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-blue-500/30 bg-gray-950/85 px-1 py-0.5 backdrop-blur-sm sm:px-1.5 sm:py-1">
      {MODES.map(({ mode: m, label, shortcut, activeBg, activeBorder, activeText }) => {
        const isActive = mode === m;
        const disabled =
          (m === 'PLACE' && !!rcmPoint) ||
          (m === 'EDIT' && !rcmPoint) ||
          (m === 'REPLAY' && trailData.length === 0);

        return (
          <button
            key={m}
            disabled={disabled}
            onClick={() => {
              setMode(m);
            }}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? `${activeBg} ${activeText} border ${activeBorder}`
                : disabled
                  ? 'cursor-not-allowed text-gray-600'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <span>{label}</span>
            <kbd className="rounded bg-black/30 px-1 py-0.5 text-[10px] font-mono opacity-60">
              {shortcut}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
