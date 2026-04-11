import { useSimulationStore } from '../../stores/simulationStore';
import { MAX_INSERTION_DEPTH } from '../../constants';

export function ControlPanel() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const togglePlayback = useSimulationStore((s) => s.togglePlayback);
  const clearTrails = useSimulationStore((s) => s.clearTrails);
  const reset = useSimulationStore((s) => s.reset);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const setInsertionDepth = useSimulationStore((s) => s.setInsertionDepth);
  const phase = useSimulationStore((s) => s.phase);

  return (
    <div className="hud-panel hud-controls">
      <h3>Controls</h3>

      <div className="control-group">
        <label>
          Insertion Depth: {insertionDepth.toFixed(1)} mm
        </label>
        <input
          type="range"
          min={0}
          max={MAX_INSERTION_DEPTH}
          step={0.1}
          value={insertionDepth}
          onChange={(e) => setInsertionDepth(parseFloat(e.target.value))}
          disabled={!phase || phase === 'IDLE'}
        />
      </div>

      <div className="button-row">
        <button onClick={togglePlayback} disabled={!phase || phase === 'IDLE'}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={clearTrails}>Clear Trails</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div className="instructions">
        <p>Click eyeball to place needle</p>
        <p>Drag to tilt, scroll to insert</p>
      </div>
    </div>
  );
}
