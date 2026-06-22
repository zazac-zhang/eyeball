import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EYEBALL_RADIUS, COLORS } from '../../constants';
import { useSimulationStore } from '../../stores/simulationStore';

/**
 * Seeded PRNG for deterministic iris texture.
 */
function createIrisRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a procedural iris texture with radial fibers, crypts, and color gradient.
 *
 * Canvas layout (RingGeometry UV mapping):
 * - x-axis (u): angular direction around the iris (0 to 2π)
 * - y-axis (v): radial direction, inner pupil edge (top) to outer limbus edge (bottom)
 */
function createIrisTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const rng = createIrisRng(123);

  const rgba = (r: number, g: number, b: number, a: number) =>
    'rgba(' + r.toFixed(0) + ', ' + g.toFixed(0) + ', ' + b.toFixed(0) + ', ' + a.toFixed(3) + ')';

  // Base color gradient: darker near pupil (top), lighter near limbus (bottom)
  // Inner edge: deep blue (#1a3870), outer edge: lighter blue (#5a98d0)
  for (let y = 0; y < height; y++) {
    const t = y / height; // 0 = inner (pupil edge), 1 = outer (limbus edge)
    const r = 26 + t * 64;
    const g = 56 + t * 96;
    const b = 112 + t * 96;
    ctx.fillStyle = rgba(r, g, b, 1);
    ctx.fillRect(0, y, width, 1);
  }

  // Draw radial fibers (collarette pattern)
  // Fibers run from inner edge toward outer edge (top to bottom in texture space)
  const fiberCount = 128;
  for (let i = 0; i < fiberCount; i++) {
    const x = (i / fiberCount) * width + (rng() - 0.5) * 4;
    const fiberWidth = 1 + rng() * 3;
    const fiberLength = height * (0.5 + rng() * 0.5);
    const startY = rng() * height * 0.15; // start near inner edge

    // Fiber color: slightly lighter or darker than base
    const brightness = 0.7 + rng() * 0.6;
    const fr = (40 + rng() * 50) * brightness;
    const fg = (80 + rng() * 60) * brightness;
    const fb = (140 + rng() * 60) * brightness;
    const fAlpha = 0.15 + rng() * 0.25;

    ctx.beginPath();
    ctx.moveTo(x, startY);

    // Slight angular wander as fiber extends outward
    let cx = x;
    for (let step = 0; step < fiberLength; step += 2) {
      cx += (rng() - 0.5) * 0.8;
      ctx.lineTo(cx, startY + step);
    }

    ctx.strokeStyle = rgba(fr, fg, fb, fAlpha);
    ctx.lineWidth = fiberWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Add collarette ring — a brighter band at ~40% from inner edge
  const collaretteY = height * 0.4;
  const collaretteHeight = height * 0.12;
  const collaretteGrad = ctx.createLinearGradient(0, collaretteY - collaretteHeight, 0, collaretteY + collaretteHeight);
  collaretteGrad.addColorStop(0, rgba(60, 100, 160, 0));
  collaretteGrad.addColorStop(0.3, rgba(80, 130, 190, 0.2));
  collaretteGrad.addColorStop(0.5, rgba(100, 150, 210, 0.3));
  collaretteGrad.addColorStop(0.7, rgba(80, 130, 190, 0.2));
  collaretteGrad.addColorStop(1, rgba(60, 100, 160, 0));
  ctx.fillStyle = collaretteGrad;
  ctx.fillRect(0, collaretteY - collaretteHeight, width, collaretteHeight * 2);

  // Add crypts (dark spots between fibers)
  const cryptCount = 40;
  for (let i = 0; i < cryptCount; i++) {
    const cx = rng() * width;
    const cy = height * 0.15 + rng() * height * 0.6;
    const cr = 2 + rng() * 5;

    const cryptGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cryptGrad.addColorStop(0, rgba(15, 25, 50, 0.4));
    cryptGrad.addColorStop(0.6, rgba(20, 35, 65, 0.2));
    cryptGrad.addColorStop(1, rgba(30, 50, 90, 0));
    ctx.fillStyle = cryptGrad;
    ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  }

  // Add fine radial striations for detail
  for (let i = 0; i < 200; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const len = 3 + rng() * 8;
    ctx.strokeStyle = rgba(30 + rng() * 40, 60 + rng() * 40, 120 + rng() * 40, 0.08 + rng() * 0.1);
    ctx.lineWidth = 0.5 + rng() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 2, y + len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Cornea: transparent spherical cap covering the front of the eyeball.
 *
 * The cornea dome is modeled as a spherical cap (r=5mm, 60° arc)
 * centered at z = eyeball_radius - 5 = 7mm. Its front pole touches
 * the eyeball surface at z=12mm and protrudes ~2mm forward.
 *
 * Rendered BEFORE the iris so the iris shows through the transparent dome.
 */
const CORNEA_RADIUS_CURVATURE = 5;
const CORNEA_CENTER_Z = EYEBALL_RADIUS - CORNEA_RADIUS_CURVATURE;
const CORNEA_CAP_ANGLE = Math.PI / 3; // 60°

// Pre-computed limbus values
const LIMBUS_Z = CORNEA_CENTER_Z + CORNEA_RADIUS_CURVATURE * Math.cos(CORNEA_CAP_ANGLE);
const CORNEA_EDGE_RADIUS = CORNEA_RADIUS_CURVATURE * Math.sin(CORNEA_CAP_ANGLE);
const EYEBALL_WIDTH_AT_LIMBUS = Math.sqrt(
  EYEBALL_RADIUS * EYEBALL_RADIUS - LIMBUS_Z * LIMBUS_Z
);
export const LIMBUS_RADIUS = (CORNEA_EDGE_RADIUS + EYEBALL_WIDTH_AT_LIMBUS) / 2;

export function Cornea() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(
      CORNEA_RADIUS_CURVATURE,
      64,
      32,
      0,
      Math.PI * 2,
      0,
      CORNEA_CAP_ANGLE
    );
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 0, CORNEA_CENTER_Z]}>
      <meshPhysicalMaterial
        color={COLORS.cornea}
        transparent
        opacity={0.25}
        roughness={0.01}
        metalness={0.0}
        clearcoat={1.0}
        clearcoatRoughness={0.01}
        transmission={0.95}
        thickness={3.0}
        attenuationColor={new THREE.Color('#e8f4ff')}
        attenuationDistance={10.0}
        side={THREE.DoubleSide}
        ior={1.376}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

/**
 * Iris: the colored ring at the front of the eye, just behind the cornea surface.
 * Positioned at z = 11.5 (inside the eyeball), facing +Z.
 *
 * The pupil (inner circle) dynamically scales based on needle insertion depth,
 * simulating a surgical response (deeper insertion → larger pupil).
 */
export function Iris() {
  const IRIS_OUTER_RADIUS = EYEBALL_RADIUS * 0.38;
  const IRIS_Z = EYEBALL_RADIUS - 0.5;

  const pupilMeshRef = useRef<THREE.Mesh>(null);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const irisTexture = useMemo(() => createIrisTexture(), []);

  // Animate pupil size based on insertion depth
  useFrame(() => {
    if (!pupilMeshRef.current) return;
    // Pupil scales from base radius (0.35 of iris outer) up to 0.8 at max insertion
    const baseRatio = 0.35;
    const maxRatio = 0.8;
    const maxDepth = 18;
    const ratio = baseRatio + (maxRatio - baseRatio) * Math.min(insertionDepth / maxDepth, 1);
    const targetRadius = IRIS_OUTER_RADIUS * ratio;
    const currentScale = targetRadius / (IRIS_OUTER_RADIUS * baseRatio);
    pupilMeshRef.current.scale.set(currentScale, currentScale, 1);
  });

  return (
    <>
      <mesh position={[0, 0, IRIS_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[IRIS_OUTER_RADIUS * 0.35, IRIS_OUTER_RADIUS, 64]} />
        <meshPhysicalMaterial
          map={irisTexture}
          emissive={COLORS.iris}
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
          roughness={0.35}
          metalness={0.05}
          transmission={0.15}
          thickness={0.6}
          attenuationColor={new THREE.Color('#3a70b0')}
          attenuationDistance={2.0}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          envMapIntensity={0.6}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={pupilMeshRef}
        position={[0, 0, IRIS_Z - 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[IRIS_OUTER_RADIUS * 0.35, 32]} />
        <meshPhysicalMaterial
          color="#050510"
          roughness={0.95}
          metalness={0.0}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/**
 * Limbus: the ring where the clear cornea meets the white sclera.
 */
/**
 * Limbus: the transition zone between the clear cornea and the white sclera.
 * Uses a wider, softer torus to create a gradual blend rather than a hard edge.
 */
export function LimbusRing() {
  const geometry = useMemo(() => {
    const geo = new THREE.TorusGeometry(LIMBUS_RADIUS, 0.35, 24, 64);
    geo.translate(0, 0, LIMBUS_Z);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.limbus}
        emissive={COLORS.limbus}
        emissiveIntensity={0.08}
        transparent
        opacity={0.6}
        roughness={0.25}
        metalness={0.05}
        clearcoat={0.5}
        clearcoatRoughness={0.15}
        transmission={0.2}
        thickness={1.0}
        attenuationColor={new THREE.Color('#c0d8ee')}
        attenuationDistance={4.0}
        envMapIntensity={0.8}
        depthWrite={false}
      />
    </mesh>
  );
}

export { LIMBUS_Z };
