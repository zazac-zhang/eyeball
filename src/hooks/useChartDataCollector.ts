import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../stores/simulationStore';

/**
 * Hook that collects chart data points when insertion depth changes.
 * Samples at 100ms intervals to avoid excessive data points.
 */
export function useChartDataCollector() {
  const mode = useSimulationStore((s) => s.mode);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const addChartDataPoint = useSimulationStore((s) => s.addChartDataPoint);
  const lastDepthRef = useRef(insertionDepth);
  const lastUpdateRef = useRef(0); // Initialize with 0 instead of Date.now()

  useEffect(() => {
    // Initialize lastUpdateRef on first mount
    if (lastUpdateRef.current === 0) {
      lastUpdateRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    // Only collect in EDIT mode
    if (mode !== 'EDIT') return;

    // Only collect when depth actually changes
    if (Math.abs(insertionDepth - lastDepthRef.current) < 0.1) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Throttle to 100ms intervals
    if (timeSinceLastUpdate < 100) return;

    lastDepthRef.current = insertionDepth;
    lastUpdateRef.current = now;
    addChartDataPoint(insertionDepth);
  }, [insertionDepth, mode, addChartDataPoint]);
}
