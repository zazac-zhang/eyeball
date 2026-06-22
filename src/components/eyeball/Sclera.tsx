import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Ensures deterministic texture generation across renders.
 */
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface VesselSegment {
  x: number;
  y: number;
  radius: number;
  generation: number;
  angle: number;
  opacity: number;
  isVenous: boolean;
}

/**
 * Generate a procedural blood vessel texture for the sclera surface.
 * Uses recursive branching algorithm for anatomically plausible vascular networks.
 *
 * Vessels are densest near the limbus (upper portion of texture) and sparser
 * toward the posterior (lower portion). Major trunks branch into capillaries
 * with decreasing thickness and opacity.
 */
function createVesselTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const rawCtx = canvas.getContext('2d');
  if (!rawCtx) return new THREE.CanvasTexture(canvas);
  const ctx: CanvasRenderingContext2D = rawCtx;

  const rng = createRng(42);

  /** Build an rgba() color string without template literal type issues. */
  const rgba = (r: number, g: number, b: number, a: number) =>
    'rgba(' + r.toFixed(0) + ', ' + g.toFixed(0) + ', ' + b.toFixed(0) + ', ' + a.toFixed(3) + ')';

  // Base: warm white sclera with subtle color variation
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#f8f4f0');
  gradient.addColorStop(0.3, '#f5f0ec');
  gradient.addColorStop(0.7, '#f2ede8');
  gradient.addColorStop(1, '#efe8e2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add subtle noise to the base for organic feel
  for (let i = 0; i < 8000; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const alpha = rng() * 0.03;
    const shade = 180 + rng() * 40;
    ctx.fillStyle = rgba(shade, shade - 20, shade - 30, alpha);
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }

  // Limbus region: v ≈ 0.18-0.25 on the sphere maps to y ≈ 0.18*size to 0.25*size
  // Vessels are densest here and grow toward posterior (increasing y)
  const LIMBUS_Y = size * 0.2;
  const CORNEA_LIMIT = size * 0.12; // vessels don't enter cornea
  const POSTERIOR_LIMIT = size * 0.85;

  /**
   * Recursively draw a vessel segment and its branches.
   */
  function drawVessel(seg: VesselSegment, depth: number) {
    if (depth > 6 || seg.radius < 0.3) return;
    if (seg.y < CORNEA_LIMIT || seg.y > POSTERIOR_LIMIT) return;

    // Determine segment length based on generation
    const segLength = (15 + rng() * 25) * (1 - depth * 0.1);
    const steps = Math.ceil(segLength / 2);

    // Color: venous (darker, bluer) for thicker vessels, arterial (brighter) for thinner
    const baseR = seg.isVenous ? 160 : 195;
    const baseG = seg.isVenous ? 50 : 70;
    const baseB = seg.isVenous ? 60 : 75;

    // Opacity decreases with generation
    const baseOpacity = seg.opacity * (1 - depth * 0.15);

    // Draw the segment as a series of points with slight wander
    ctx.beginPath();
    ctx.moveTo(seg.x, seg.y);

    let cx = seg.x;
    let cy = seg.y;
    let currentAngle = seg.angle;
    let currentRadius = seg.radius;
    const branchPoints: VesselSegment[] = [];

    for (let i = 0; i < steps; i++) {
      // Slight random angular wander
      currentAngle += (rng() - 0.5) * 0.3;
      // General tendency to grow toward posterior (downward)
      currentAngle += (Math.PI / 2 - currentAngle) * 0.02;

      const stepLen = 2;
      cx += Math.cos(currentAngle) * stepLen;
      cy += Math.sin(currentAngle) * stepLen;

      // Wrap horizontally for seamless tiling
      if (cx < 0) cx += size;
      if (cx >= size) cx -= size;

      // Taper radius along segment
      currentRadius = seg.radius * (1 - i / steps * 0.3);

      ctx.lineTo(cx, cy);

      // Decide whether to branch at this point
      if (i > steps * 0.3 && i < steps * 0.8 && rng() < 0.08 && depth < 5) {
        const branchAngle = currentAngle + (rng() > 0.5 ? 1 : -1) * (0.4 + rng() * 0.8);
        branchPoints.push({
          x: cx,
          y: cy,
          radius: currentRadius * (0.5 + rng() * 0.2),
          generation: depth + 1,
          angle: branchAngle,
          opacity: baseOpacity * 0.8,
          isVenous: rng() > 0.4,
        });
      }
    }

    // Draw with varying width (thicker at start, thinner at end)
    ctx.strokeStyle = rgba(baseR, baseG, baseB, baseOpacity);
    ctx.lineWidth = Math.max(0.5, seg.radius * 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw a second pass with slightly lighter color for depth illusion
    if (seg.radius > 1) {
      ctx.strokeStyle = rgba(baseR + 30, baseG + 20, baseB + 20, baseOpacity * 0.4);
      ctx.lineWidth = Math.max(0.3, seg.radius * 0.8);
      ctx.stroke();
    }

    // Recurse into branches
    for (const branch of branchPoints) {
      drawVessel(branch, depth + 1);
    }
  }

  // Seed major trunks along the limbus region
  const trunkCount = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < trunkCount; i++) {
    const x = (i / trunkCount) * size + (rng() - 0.5) * size * 0.15;
    const y = LIMBUS_Y + (rng() - 0.5) * size * 0.06;
    const angle = Math.PI / 2 + (rng() - 0.5) * 0.6; // mostly downward
    const isVenous = rng() > 0.5;

    drawVessel({
      x: ((x % size) + size) % size,
      y,
      radius: 2.0 + rng() * 1.5,
      generation: 0,
      angle,
      opacity: 0.35 + rng() * 0.15,
      isVenous,
    }, 0);
  }

  // Add secondary smaller trunks between the main ones
  for (let i = 0; i < 8; i++) {
    const x = rng() * size;
    const y = LIMBUS_Y + size * 0.05 + rng() * size * 0.15;
    const angle = Math.PI / 2 + (rng() - 0.5) * 1.0;

    drawVessel({
      x,
      y,
      radius: 1.0 + rng() * 0.8,
      generation: 0,
      angle,
      opacity: 0.2 + rng() * 0.1,
      isVenous: rng() > 0.5,
    }, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function Sclera() {
  const { geometry, vesselMap } = useMemo(() => {
    const geo = new THREE.SphereGeometry(EYEBALL_RADIUS, 64, 64);
    const tex = createVesselTexture();
    return { geometry: geo, vesselMap: tex };
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.sclera}
        roughness={0.25}
        metalness={0.0}
        clearcoat={0.6}
        clearcoatRoughness={0.15}
        transmission={0.08}
        thickness={1.5}
        attenuationColor={new THREE.Color('#ffe8d6')}
        attenuationDistance={5.0}
        side={THREE.FrontSide}
        map={vesselMap}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

export function EyeInterior() {
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(EYEBALL_RADIUS - 0.5, 48, 48);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.interior}
        roughness={0.9}
        metalness={0.0}
        side={THREE.BackSide}
        envMapIntensity={0.2}
      />
    </mesh>
  );
}

/**
 * Retina: semi-transparent inner layer lining the back of the eyeball.
 * Rendered just inside the sclera with BackSide so it appears as a
 * faint inner surface, simulating the light-sensitive retinal layer.
 */
export function Retina() {
  const RETINA_RADIUS = EYEBALL_RADIUS - 0.3;
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(RETINA_RADIUS, 64, 64);
  }, [RETINA_RADIUS]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#d4a0bc"
        transparent
        opacity={0.2}
        roughness={0.7}
        metalness={0.0}
        transmission={0.05}
        thickness={0.5}
        attenuationColor={new THREE.Color('#e8b0c8')}
        attenuationDistance={3.0}
        side={THREE.BackSide}
        depthWrite={false}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}
