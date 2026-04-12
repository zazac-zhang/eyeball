import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { EYEBALL_RADIUS } from '../../constants';

/**
 * 2D top-down minimap showing spatial relationships.
 *
 * Displays:
 * - Eyeball circle (top-down view)
 * - RCM point(s) positions
 * - Needle tip position
 * - Trajectory trail projection
 * - Current needle direction indicator
 */
export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rcmPoints = useSimulationStore((s) => s.rcmPoints);
  const currentRCMIndex = useSimulationStore((s) => s.currentRCMIndex);
  const trailPoints = useSimulationStore((s) => s.trailPoints);
  const tiltAlpha = useSimulationStore((s) => s.tiltAlpha);
  const tiltBeta = useSimulationStore((s) => s.tiltBeta);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);

  // Calculate needle tip position
  const tipPosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!rcmPoint || !surfaceNormal) {
      tipPosition.current = null;
      return;
    }

    // Simple 2D projection (top-down view, looking from +Z)
    // Convert 3D position to 2D canvas coordinates

    // Calculate rotation matrix for tilt angles
    const cosAlpha = Math.cos(tiltAlpha);
    const sinAlpha = Math.sin(tiltAlpha);
    const cosBeta = Math.cos(tiltBeta);
    const sinBeta = Math.sin(tiltBeta);

    // Needle direction in 3D
    const direction = {
      x: sinBeta * cosAlpha,
      y: sinAlpha,
      z: cosAlpha * cosBeta,
    };

    // Tip position in 2D (projection from top)
    const scale = 8; // Scale factor for better visibility
    const centerX = 100; // Canvas center
    const centerY = 100;

    const tipX = centerX + (rcmPoint[0] + direction.x * insertionDepth) * scale;
    const tipY = centerY + (rcmPoint[1] + direction.y * insertionDepth) * scale;

    tipPosition.current = { x: tipX, y: tipY };
  }, [rcmPoint, surfaceNormal, tiltAlpha, tiltBeta, insertionDepth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 8; // Scale factor
    const centerX = 100;
    const centerY = 100;
    const radius = EYEBALL_RADIUS * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw eyeball circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    ctx.fill();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw RCM points
    rcmPoints.forEach((rcm, index) => {
      const x = centerX + rcm.point[0] * scale;
      const y = centerY + rcm.point[1] * scale;
      const isCurrent = index === currentRCMIndex;

      // RCM point marker
      ctx.beginPath();
      ctx.arc(x, y, isCurrent ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#44ff88' : '#4488ff';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // RCM point label
      ctx.fillStyle = '#93c5fd';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`RCM${String(index + 1)}`, x, y - 10);
    });

    // Draw trail points
    if (trailPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      trailPoints.forEach((point) => {
        const x = centerX + point[0] * scale;
        const y = centerY + point[1] * scale;
        if (trailPoints.indexOf(point) === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw needle tip
    if (tipPosition.current) {
      const { x, y } = tipPosition.current;

      // Tip position
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6600';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Direction indicator
      if (rcmPoint) {
        const rcmX = centerX + rcmPoint[0] * scale;
        const rcmY = centerY + rcmPoint[1] * scale;

        ctx.beginPath();
        ctx.moveTo(rcmX, rcmY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw scale indicator
    ctx.fillStyle = '#93c5fd';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Scale: 1mm = 8px', 10, canvas.height - 10);
  }, [
    canvasRef,
    rcmPoints,
    currentRCMIndex,
    trailPoints,
    rcmPoint,
    surfaceNormal,
    tiltAlpha,
    tiltBeta,
    insertionDepth,
  ]);

  return (
    <div className="pointer-events-auto rounded-lg border border-blue-500/30 bg-gray-950/85 p-3 text-blue-100 backdrop-blur">
      <h3 className="mb-2 border-b border-blue-500/20 pb-1 text-xs font-semibold tracking-wider text-blue-400 uppercase">
        Top-Down View
      </h3>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="rounded border border-blue-500/20 bg-gray-900/50"
      />
      <div className="mt-2 flex justify-between text-[10px] text-blue-300/60">
        <span>XY Projection</span>
        <span>{rcmPoints.length} RCM</span>
      </div>
    </div>
  );
}
