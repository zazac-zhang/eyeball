import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSimulationStore } from '../../stores/simulationStore';

/**
 * Real-time depth chart showing insertion depth over time.
 *
 * Displays the last 100 data points as a line chart,
 * helping surgeons analyze their insertion patterns.
 */
export function RealTimeChart() {
  const chartData = useSimulationStore((s) => s.chartData);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const mode = useSimulationStore((s) => s.mode);

  // Format data for display (relative time in seconds)
  const formattedData = useMemo(() => {
    if (chartData.length === 0) return [];

    const startTime = chartData[0].timestamp;
    return chartData.map((point) => ({
      time: ((point.timestamp - startTime) / 1000).toFixed(1),
      depth: point.depth.toFixed(2),
    }));
  }, [chartData]);

  if (chartData.length < 2 && mode !== 'EDIT') {
    return (
      <div className="pointer-events-auto min-w-[300px] rounded-lg border border-blue-500/30 bg-gray-950/85 p-4 text-blue-100 backdrop-blur">
        <h3 className="mb-3 border-b border-blue-500/20 pb-2 text-sm font-semibold tracking-wider text-blue-400 uppercase">
          Depth Chart
        </h3>
        <div className="flex h-[150px] items-center justify-center text-xs text-blue-300/50">
          No data yet - start inserting needle
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto min-w-[300px] rounded-lg border border-blue-500/30 bg-gray-950/85 p-4 text-blue-100 backdrop-blur">
      <div className="mb-3 flex items-center justify-between border-b border-blue-500/20 pb-2">
        <h3 className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
          Depth Chart
        </h3>
        <div className="text-xs text-blue-300/70">
          Current: {insertionDepth.toFixed(1)} mm
        </div>
      </div>

      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#93c5fd', fontSize: 10 }}
              stroke="#4488ff"
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#93c5fd', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: '#93c5fd', fontSize: 10 }}
              stroke="#4488ff"
              label={{ value: 'Depth (mm)', angle: -90, position: 'insideLeft', fill: '#93c5fd', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 30, 0.9)',
                border: '1px solid rgba(100, 140, 255, 0.3)',
                borderRadius: '4px',
                color: '#c8d8f0',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#93c5fd' }}
            />
            <Line
              type="monotone"
              dataKey="depth"
              stroke="#4488ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#4488ff', stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {chartData.length > 0 && (
        <div className="mt-2 border-t border-blue-500/15 pt-2 text-[10px] text-blue-300/60">
          {chartData.length} data points • Last {((chartData[chartData.length - 1].timestamp - chartData[0].timestamp) / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
