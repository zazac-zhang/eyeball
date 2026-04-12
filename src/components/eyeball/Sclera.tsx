import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

/**
 * Generate a procedural blood vessel texture for the sclera surface.
 * Uses layered sine waves to simulate vascular patterns.
 */
function createVesselTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base: white sclera
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, size, size);

  // Vessel pattern: thin red/pink lines
  ctx.strokeStyle = 'rgba(200, 80, 80, 0.15)';
  ctx.lineWidth = 1;

  // Horizontal vessels
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * size;
    ctx.beginPath();
    for (let x = 0; x < size; x += 4) {
      const wave = Math.sin(x * 0.02 + i) * 5 + Math.sin(x * 0.05 + i * 2) * 2;
      if (x === 0) {
        ctx.moveTo(x, y + wave);
      } else {
        ctx.lineTo(x, y + wave);
      }
    }
    ctx.stroke();
  }

  // Vertical/diagonal vessels
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    ctx.beginPath();
    for (let y = 0; y < size; y += 4) {
      const wave = Math.sin(y * 0.03 + i * 1.5) * 4 + Math.cos(y * 0.07 + i) * 2;
      if (y === 0) {
        ctx.moveTo(x + wave, y);
      } else {
        ctx.lineTo(x + wave, y);
      }
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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
        roughness={0.3}
        metalness={0.0}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
        side={THREE.FrontSide}
        map={vesselMap}
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
      <meshStandardMaterial
        color={COLORS.interior}
        roughness={0.95}
        metalness={0.0}
        side={THREE.BackSide}
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
      <meshStandardMaterial
        color="#d4a0bc"
        transparent
        opacity={0.15}
        roughness={0.8}
        metalness={0.0}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
