import { useCallback, useRef, useState, useEffect } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { exportTrailJSON, importTrailJSON, createScreenRecorder } from '../../lib/export';
import { SettingsPanel } from './SettingsPanel';

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
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<ReturnType<typeof createScreenRecorder> | null>(null);
  const mode = useSimulationStore((s) => s.mode);
  const clearTrails = useSimulationStore((s) => s.clearTrails);
  const completeSurgery = useSimulationStore((s) => s.completeSurgery);
  const reset = useSimulationStore((s) => s.reset);
  const setMode = useSimulationStore((s) => s.setMode);
  const togglePlayback = useSimulationStore((s) => s.togglePlayback);
  const importTrailData = useSimulationStore((s) => s.importTrailData);
  const trailData = useSimulationStore((s) => s.trailData);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const playbackIndex = useSimulationStore((s) => s.playbackIndex);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useSimulationStore((s) => s.setPlaybackSpeed);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const setTiltAngles = useSimulationStore((s) => s.setTiltAngles);
  const phase = useSimulationStore((s) => s.phase);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const trailCount = useSimulationStore((s) => s.trailPoints.length);
  const canUndo = useSimulationStore((s) => s.canUndo);
  const canRedo = useSimulationStore((s) => s.canRedo);
  const undo = useSimulationStore((s) => s.undo);
  const redo = useSimulationStore((s) => s.redo);

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

  // Initialize screen recorder
  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    requestAnimationFrame(() => {
      setRecorder(createScreenRecorder(canvas));
    });
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (!recorder) return;
    if (recorder.isRecording()) {
      recorder.stop();
      setIsRecording(false);
    } else {
      recorder.start();
      setIsRecording(true);
    }
  }, [recorder]);

  const isEditMode = mode === 'EDIT';
  const isReplayMode = mode === 'REPLAY';

  return (
    <div className="pointer-events-auto w-full rounded-lg border border-blue-500/30 bg-gray-950/85 p-3 text-blue-100 backdrop-blur sm:min-w-[240px] sm:p-4">
      <h3 className="mb-2 border-b border-blue-500/20 pb-1 text-xs font-semibold tracking-wider text-blue-400 uppercase sm:mb-3 sm:text-sm">
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

      {/* Mode-specific content */}
      {!isEditMode && !isReplayMode && (
        <div className="mb-3 rounded border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-xs text-blue-300/70">
          {mode === 'VIEW' && (
            <p>
              Free observation mode. Switch to{' '}
              <button
                className="text-green-400 underline hover:text-green-300"
                onClick={() => {
                  if (rcmPoint) {
                    setMode('EDIT');
                  } else {
                    setMode('PLACE');
                  }
                }}
              >
                {rcmPoint ? 'Edit' : 'Place'}
              </button>{' '}
              to interact with the needle.
            </p>
          )}
          {mode === 'PLACE' && !rcmPoint && (
            <p>Click on the eyeball surface to place the RCM point.</p>
          )}
        </div>
      )}

      {/* EDIT mode: full controls */}
      {isEditMode && (
        <>
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
                  className={`${buttonBase} min-w-[50px]`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* REPLAY mode: playback controls */}
      {isReplayMode && (
        <>
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-blue-300/70">Progress</span>
              <span className="text-xs text-blue-100">
                {Math.floor(playbackIndex)} / {trailData.length - 1}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-500/20">
              <div
                className="h-full rounded-full bg-purple-500 transition-[width] duration-100"
                style={{
                  width:
                    trailData.length > 0
                      ? `${((playbackIndex / (trailData.length - 1)) * 100).toFixed(1)}%`
                      : '0%',
                }}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-sm text-blue-100">
              Speed: {playbackSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={playbackSpeed}
              className="w-full accent-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
              onChange={(e) => {
                setPlaybackSpeed(parseFloat(e.target.value));
              }}
            />
          </div>
        </>
      )}

      {/* Data export (visible in all modes) */}
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
          <button
            onClick={handleToggleRecording}
            className={`pointer-events-auto rounded border px-3 py-1.5 text-xs transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              isRecording
                ? 'border-red-500/40 bg-red-500/20 text-red-400 hover:border-red-500/60 hover:bg-red-500/30'
                : 'border-purple-500/40 bg-purple-500/20 text-purple-400 hover:border-purple-500/60 hover:bg-purple-500/30'
            }`}
          >
            {isRecording ? '⏹ Stop' : '⏺ Record'}
          </button>
          <button onClick={() => { setShowSettings(true); }} className={buttonBase}>
            Settings
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
          onClick={() => {
            if (isReplayMode) {
              togglePlayback();
            } else if (trailCount > 0) {
              setMode('REPLAY');
            }
          }}
          disabled={trailCount === 0}
          className={`pointer-events-auto rounded border px-3 py-1.5 text-xs transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
            isReplayMode && isPlaying
              ? 'border-amber-500/40 bg-amber-500/20 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/30'
              : 'border-green-500/40 bg-green-500/20 text-green-400 hover:border-green-500/60 hover:bg-green-500/30'
          }`}
        >
          {isReplayMode && isPlaying ? 'Stop' : trailCount > 0 ? 'Replay' : 'No Data'}
        </button>
        <button
          onClick={undo}
          disabled={!canUndo || isPlaying}
          className="pointer-events-auto rounded border border-blue-500/40 bg-blue-500/20 px-3 py-1.5 text-xs text-blue-100 transition-all duration-150 hover:bg-blue-500/40 hover:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↩ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo || isPlaying}
          className="pointer-events-auto rounded border border-blue-500/40 bg-blue-500/20 px-3 py-1.5 text-xs text-blue-100 transition-all duration-150 hover:bg-blue-500/40 hover:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↪ Redo
        </button>
        <button onClick={clearTrails} disabled={isPlaying} className={buttonBase}>
          Clear Trails
        </button>
        <button
          onClick={completeSurgery}
          disabled={phase !== 'WITHDRAWING'}
          className="pointer-events-auto rounded border border-green-500/40 bg-green-500/20 px-3 py-1.5 text-xs text-green-400 transition-all duration-150 hover:border-green-500/60 hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Complete
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
            V
          </kbd>{' '}
          View &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            P
          </kbd>{' '}
          Place &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            E
          </kbd>{' '}
          Edit &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            R
          </kbd>{' '}
          Replay
        </p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Esc
          </kbd>{' '}
          Reset &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            C
          </kbd>{' '}
          Clear trails &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Ctrl+Z
          </kbd>{' '}
          Undo &nbsp;{' '}
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            Ctrl+Shift+Z
          </kbd>{' '}
          Redo
        </p>
        <p>
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            ↑↓←→
          </kbd>{' '}
          Adjust needle (Edit mode) &nbsp;
          <kbd className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-mono text-[10px] text-blue-100">
            1-4
          </kbd>{' '}
          Presets
        </p>
      </div>

      {showSettings && <SettingsPanel onClose={() => { setShowSettings(false); }} />}
    </div>
  );
}
