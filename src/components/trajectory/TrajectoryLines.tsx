import * as THREE from 'three';
import { useMemo } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';

/**
 * Trajectory trail with heatmap coloring based on time.
 *
 * Colors gradient from blue (early points) to red (recent points),
 * helping users visualize the temporal progression of needle movement.
 *
 * Uses custom BufferGeometry with vertex colors for smooth gradients.
 */
export function TrajectoryLines() {
  const trailData = useSimulationStore((s) => s.trailData);

  const geometry = useMemo(() => {
    if (trailData.length < 2) return null;

    const points: THREE.Vector3[] = [];
    const colors: number[] = [];

    // Find time range for normalization
    const timestamps = trailData.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1; // Avoid division by zero

    // Generate line segments and colors
    for (let i = 0; i < trailData.length - 1; i++) {
      const p1 = new THREE.Vector3(trailData[i].tipPosition[0], trailData[i].tipPosition[1], trailData[i].tipPosition[2]);
      const p2 = new THREE.Vector3(
        trailData[i + 1].tipPosition[0],
        trailData[i + 1].tipPosition[1],
        trailData[i + 1].tipPosition[2]
      );

      points.push(p1, p2);

      // Color for point 1
      const normalizedTime1 = (trailData[i].timestamp - minTime) / timeRange;
      const color1 = getTimeColor(normalizedTime1);
      colors.push(color1.r, color1.g, color1.b);

      // Color for point 2
      const normalizedTime2 = (trailData[i + 1].timestamp - minTime) / timeRange;
      const color2 = getTimeColor(normalizedTime2);
      colors.push(color2.r, color2.g, color2.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setFromPoints(points);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geo;
  }, [trailData]);

  if (!geometry) return null;

  return <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }))} />;
}

/**
 * Convert normalized time (0-1) to RGB color.
 * Gradient: blue → cyan → green → yellow → red
 */
function getTimeColor(normalizedTime: number): THREE.Color {
  let r = 0,
    g = 0,
    b = 0;

  if (normalizedTime < 0.25) {
    // Blue to cyan
    const t = normalizedTime / 0.25;
    r = 0;
    g = t;
    b = 1;
  } else if (normalizedTime < 0.5) {
    // Cyan to green
    const t = (normalizedTime - 0.25) / 0.25;
    r = 0;
    g = 1;
    b = 1 - t;
  } else if (normalizedTime < 0.75) {
    // Green to yellow
    const t = (normalizedTime - 0.5) / 0.25;
    r = t;
    g = 1;
    b = 0;
  } else {
    // Yellow to red
    const t = (normalizedTime - 0.75) / 0.25;
    r = 1;
    g = 1 - t;
    b = 0;
  }

  return new THREE.Color(r, g, b);
}
