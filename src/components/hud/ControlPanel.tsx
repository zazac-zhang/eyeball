import { useCallback, useRef } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { exportTrailJSON, importTrailJSON } from '../../lib/export';

const phaseBadgeStyle: Record<string, string> = {
  IDLE: 'bg-gray-500/20 text-gray-400',
  CONTACT: 'bg-blue-500/20 text-blue-400',
  INSERTING: 'bg-green-500/20 text-green-400',
  WITHDRAWING: 'bg-amber-500/20 text-amber-400',
  COMPLETE: 'bg-red-500/20 text-red-400',
};

const sliderClass = 'w-full accent-blue-500 [&::-webkit-slider-thumb]:cursor-pointer';

const buttonBase =
  'pointer-events-auto rounded border border-blue-500/40 bg-blue-500/20 px-3 py-1.5 text-xs text-blue-100 transition-all duration-150 hover:bg-blue-500/40 hover:border-blue-500/60 disabled:opacity-40 disabled:cursor-not-allowed';

export function ControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clearTrails = useSimulationStore((s) => s.clearTrails);
  const reset = useSimulationStore((s) => s.reset);
  const togglePlayback = useSimulationStore((s) => s.togglePlayback);
  const importTrailData = useSimulationStore((s) => s.importTrailData);
  const trailData = useSimulationStore((s) => s.trailData);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const setTiltAngles = useSimulationStore((s) => s.setTiltAngles);
  const phase = useSimulationStore((s) => s.phase);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const trailCount = useSimulationStore((s) => s.trailPoints.length);

  const handleExport = useCallback(() => {
    exportTrailJSON(trailData);
  }, [trailData]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void (async () => {
        const data = await importTrailJSON(file);
        if (data) {
          importTrailData(data.trailPoints);
        }
      })();
    },
    [importTrailData]
  );

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eyeball-screenshot.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  return (
    <div className="pointer-events-auto min-w-[240px] rounded-lg border border-blue-500/30 bg-gray-950/85 p-4 text-blue-100 backdrop-blur">
      <h3 className="mb-3 border-b border-blue-500/20 pb-2 text-sm font-semibold tracking-wider text-blue-400 uppercase">
        Controls
      </h3>

      {/* Phase indicator */}
      <div className="mb-3 flex items-center justify-between rounded bg-blue-500/10 px-2 py-1">
        <span className="text-xs text-blue-300/70">Phase</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wider ${phaseBadgeStyle[phase] ?? ''}`}
        >
          {phase}
        </span>
      </div>

      {/* Manual tilt controls */}
      <div className="mb-3">
        <label className="mb-1.5 block text-sm text-blue-100">
          Tilt Alpha (elevation): {(tiltAlpha * (180 / Math.PI)).toFixed(1)}deg
        </label>
        <input
          type="range"
          min={-MAX_TILT_ANGLE}
          max={MAX_TILT_ANGLE}
          step={0.01}
          value={tiltAlpha}
          className={sliderClass}
          onChange={(e) => {
            setTiltAngles(parseFloat(e.target.value), tiltBeta);
          }}
          disabled={!rcmPoint}
        />
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-sm text-blue-100">
          Tilt Beta (azimuth): {(tiltBeta * (180 / Math.PI)).toFixed(1)}deg
        </label>
        <input
          type="range"
          min={-Math.PI}
          max={Math.PI}
          step={0.01}
          value={tiltBeta}
          className={sliderClass}
          onChange={(e) => {
            setTiltAngles(tiltAlpha, parseFloat(e.target.value));
          }}
          disabled={!rcmPoint}
        />
      </div>

      {/* Insertion depth control */}
      <div className="mb-3">
        <label className="mb-1.5 block text-sm text-blue-100">
          Insertion Depth: {insertionDepth.toFixed(1)} mm
        </label>
        <input
          type="range"
          min={0}
          max={MAX_INSERTION_DEPTH}
          step={0.1}
          value={insertionDepth}
          className={sliderClass}
          onChange={(e) => {
            setInsertionDepth(parseFloat(e.target.value));
          }}
          disabled={!rcmPoint}
        />
      </div>

      {/* Preset angles */}
      <div className="mb-3">
        <label className="mb-1.5 block text-sm text-blue-100">Preset Angles</label>
        <div className="flex flex-wrap gap-2">
          {[
            [0, 0, '0deg'],
            [Math.PI / 12, 0, '15deg'],
            [Math.PI / 6, 0, '30deg'],
            [MAX_TILT_ANGLE, 0, '45deg'],
          ].map(([a, b, label]) => (
            <button
              key={label}
              onClick={() => {
                setTiltAngles(a as number, b as number);
              }}
              disabled={!rcmPoint}
              className={`${buttonBase} min-w-[50px]`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Data export */}
      <div className="mb-3">
        <label className="mb-1.5 block text-sm text-blue-100">Data</label>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} disabled={trailCount === 0} className={buttonBase}>
            Export JSON
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className={buttonBase}
          >
            Import JSON
          </button>
          <button onClick={handleScreenshot} className={buttonBase}>
            Screenshot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={togglePlayback}
          disabled={trailCount === 0}
          className="pointer-events-auto rounded border border-green-500/40 bg-green-500/20 px-3 py-1.5 text-xs text-green-400 transition-all duration-150 hover:border-green-500/60 hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? 'Stop Replay' : 'Replay'}
        </button>
        <button onClick={clearTrails} disabled={isPlaying} className={buttonBase}>
          Clear Trails
        </button>
        <button
          onClick={reset}
          className="pointer-events-auto rounded border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-all duration-150 hover:border-red-500/50 hover:bg-red-500/30"
        >
          Reset
        </button>
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-3 border-t border-blue-500/15 pt-2 text-[11px] text-blue-300/50">
        <p className="mb-1 text-xs font-semibold text-blue-400">Keyboard Shortcuts</p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            R
          </kbd>{' '}
          Reset &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            C
          </kbd>{' '}
          Clear trails
        </p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            ↑↓
          </kbd>{' '}
          Insert/Withdraw &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            ←→
          </kbd>{' '}
          Rotate azimuth
        </p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            1-4
          </kbd>{' '}
          Preset tilt angles (0/15/30/45deg)
        </p>
        <p className="mt-1 mb-1 text-xs font-semibold text-blue-400">Mouse</p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Left Click
          </kbd>{' '}
          Place RCM &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Left Drag
          </kbd>{' '}
          Tilt needle &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Scroll
          </kbd>{' '}
          Insert/Withdraw
        </p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Right Drag
          </kbd>{' '}
          /{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Middle Drag
          </kbd>{' '}
          Orbit camera
        </p>
      </div>
    </div>
  );
}
