import { useRef, useState, useEffect } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { MAX_INSERTION_DEPTH, MAX_TILT_ANGLE } from '../../constants';
import { exportTrailJSON, importTrailJSON, createScreenRecorder } from '../../lib/export';
import { SettingsPanel } from './SettingsPanel';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useActionLogger } from '../../hooks/useActionLogger';

const phaseBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  IDLE: 'outline',
  CONTACT: 'secondary',
  INSERTING: 'default',
  WITHDRAWING: 'secondary',
  COMPLETE: 'destructive',
};

const kbdClass =
  'inline-flex h-5 items-center justify-center rounded border border-blue-500/30 bg-blue-500/15 px-1 font-mono text-[10px] text-blue-100';

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
  const { exportLog, clearLog } = useActionLogger();

  function handleExportLog() {
    const blob = new Blob([exportLog()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eyeball-action-log.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearLog() {
    clearLog();
  }

  function handleExport() {
    exportTrailJSON(trailData);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void (async () => {
      const data = await importTrailJSON(file);
      if (data) {
        importTrailData(data.trailPoints);
      }
    })();
  }

  function handleScreenshot() {
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
  }

  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    requestAnimationFrame(() => {
      setRecorder(createScreenRecorder(canvas));
    });
  }, []);

  function handleToggleRecording() {
    if (!recorder) return;
    if (recorder.isRecording()) {
      recorder.stop();
      setIsRecording(false);
    } else {
      recorder.start();
      setIsRecording(true);
    }
  }

  const isEditMode = mode === 'EDIT';
  const isReplayMode = mode === 'REPLAY';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="pointer-events-auto w-full rounded-lg border border-blue-500/30 bg-gray-950/85 p-3 text-blue-100 backdrop-blur sm:min-w-[240px] sm:p-4">
        <h3 className="mb-2 border-b border-blue-500/20 pb-1 text-xs font-semibold tracking-wider text-blue-400 uppercase sm:mb-3 sm:text-sm">
          Controls
        </h3>

        {/* Phase indicator */}
        <div className="mb-3 flex items-center justify-between rounded bg-blue-500/10 px-2 py-1">
          <span className="text-xs text-blue-300/70">Phase</span>
          <Badge variant={phaseBadgeVariant[phase] ?? 'outline'} className="tracking-wider">
            {phase}
          </Badge>
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
              <Slider
                min={0}
                max={MAX_TILT_ANGLE * (180 / Math.PI)}
                step={0.5}
                value={[tiltAlpha * (180 / Math.PI)]}
                onValueChange={([v]) => {
                  setTiltAngles(v * (Math.PI / 180), tiltBeta);
                }}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-sm text-blue-100">
                Tilt Beta (azimuth): {(tiltBeta * (180 / Math.PI)).toFixed(1)}deg
              </label>
              <Slider
                min={-180}
                max={180}
                step={0.5}
                value={[tiltBeta * (180 / Math.PI)]}
                onValueChange={([v]) => {
                  setTiltAngles(tiltAlpha, v * (Math.PI / 180));
                }}
              />
            </div>

            {/* Insertion depth control */}
            <div className="mb-3">
              <label className="mb-1.5 block text-sm text-blue-100">
                Insertion Depth: {insertionDepth.toFixed(1)} mm
              </label>
              <Slider
                min={0}
                max={MAX_INSERTION_DEPTH}
                step={0.1}
                value={[insertionDepth]}
                onValueChange={([v]) => {
                  setInsertionDepth(v);
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
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40 hover:text-blue-100 min-w-[50px]"
                    onClick={() => {
                      setTiltAngles(a as number, b as number);
                    }}
                  >
                    {label}
                  </Button>
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
              <Slider
                min={0.5}
                max={5}
                step={0.5}
                value={[playbackSpeed]}
                onValueChange={([v]) => {
                  setPlaybackSpeed(v);
                }}
              />
            </div>
          </>
        )}

        {/* Data export (visible in all modes) */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm text-blue-100">Data</label>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={trailCount === 0}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Export JSON
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Export trail data as JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Import JSON
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Load trail data from JSON file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScreenshot}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Screenshot
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Save canvas screenshot</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleToggleRecording}
                  className={
                    isRecording
                      ? ''
                      : 'border-purple-500/40 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                  }
                >
                  {isRecording ? '⏹ Stop' : '⏺ Record'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Record simulation as video (.webm)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSettings(true);
                  }}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Settings
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Adjust scene settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportLog}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Export Log
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Export action log as JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLog}
                  className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
                >
                  Clear Log
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Clear action log</TooltipContent>
            </Tooltip>

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
        <div className="mt-2 flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isReplayMode) {
                    togglePlayback();
                  } else if (trailCount > 0) {
                    setMode('REPLAY');
                  }
                }}
                disabled={trailCount === 0}
                className={
                  isReplayMode && isPlaying
                    ? 'border-amber-500/40 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'border-green-500/40 bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }
              >
                {isReplayMode && isPlaying ? 'Stop' : trailCount > 0 ? 'Replay' : 'No Data'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isReplayMode && isPlaying ? 'Stop playback' : 'Replay recorded trail'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo || isPlaying}
                className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
              >
                ↩ Undo
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo || isPlaying}
                className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
              >
                ↪ Redo
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTrails}
                disabled={isPlaying}
                className="border-blue-500/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/40"
              >
                Clear Trails
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Clear all trail data</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={completeSurgery}
                disabled={phase !== 'WITHDRAWING'}
                className="border-green-500/40 bg-green-500/20 text-green-400 hover:bg-green-500/30"
              >
                Complete
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Mark surgery as complete</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Reset simulation (Esc)</TooltipContent>
          </Tooltip>
        </div>

        {/* Keyboard shortcuts */}
        <div className="mt-3 border-t border-blue-500/15 pt-2 text-[11px] text-blue-300/50">
          <p className="mb-1 text-xs font-semibold text-blue-400">Keyboard Shortcuts</p>
          <p>
            <kbd className={kbdClass}>V</kbd> View &nbsp;{' '}
            <kbd className={kbdClass}>P</kbd> Place &nbsp;{' '}
            <kbd className={kbdClass}>E</kbd> Edit &nbsp;{' '}
            <kbd className={kbdClass}>R</kbd> Replay
          </p>
          <p>
            <kbd className={kbdClass}>Esc</kbd> Reset &nbsp;{' '}
            <kbd className={kbdClass}>C</kbd> Clear trails &nbsp;{' '}
            <kbd className={kbdClass}>Ctrl+Z</kbd> Undo &nbsp;{' '}
            <kbd className={kbdClass}>Ctrl+Shift+Z</kbd> Redo
          </p>
          <p>
            <kbd className={kbdClass}>↑↓←→</kbd> Adjust needle (Edit mode) &nbsp;
            <kbd className={kbdClass}>1-4</kbd> Presets
          </p>
        </div>

        {showSettings && <SettingsPanel onClose={() => { setShowSettings(false); }} />}
      </div>
    </TooltipProvider>
  );
}
