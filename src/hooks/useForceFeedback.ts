import { useMemo } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MAX_INSERTION_DEPTH } from '../constants';

/**
 * Computes simulated force feedback based on insertion depth.
 *
 * The force model is simplified:
 * - No force when depth is 0
 * - Linear increase as depth increases (tissue resistance)
 * - Maximum force at max insertion depth
 *
 * Returns:
 * - force: normalized force magnitude (0-1)
 * - color: hex color string for visualization (green → yellow → red)
 * - opacity: opacity for glow effect
 */
export function useForceFeedback() {
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);

  const forceFeedback = useMemo(() => {
    if (!rcmPoint) {
      return { force: 0, color: '#44ff88', opacity: 0 };
    }

    // Normalized force (0 to 1)
    const force = Math.min(insertionDepth / MAX_INSERTION_DEPTH, 1);

    // Color gradient: green (0) → yellow (0.5) → red (1.0)
    let color: string;
    if (force < 0.5) {
      // Green to yellow
      const t = force / 0.5;
      const r = Math.round(68 + (255 - 68) * t);
      const g = 255;
      const b = Math.round(136 * (1 - t));
      color = `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
    } else {
      // Yellow to red
      const t = (force - 0.5) / 0.5;
      const r = 255;
      const g = Math.round(255 * (1 - t));
      const b = 0;
      color = `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
    }

    // Opacity for glow effect
    const opacity = force * 0.8;

    return { force, color, opacity };
  }, [insertionDepth, rcmPoint]);

  return forceFeedback;
}
