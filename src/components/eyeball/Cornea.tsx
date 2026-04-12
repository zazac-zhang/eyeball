import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EYEBALL_RADIUS, COLORS } from '../../constants';
import { useSimulationStore } from '../../stores/simulationStore';

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
        opacity={0.35}
        roughness={0.01}
        metalness={0.0}
        clearcoat={1.0}
        clearcoatRoughness={0.01}
        side={THREE.DoubleSide}
        ior={1.376}
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
        <meshStandardMaterial
          color={COLORS.iris}
          emissive={COLORS.iris}
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
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
        <meshStandardMaterial
          color="#050510"
          side={THREE.DoubleSide}
          roughness={1.0}
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
export function LimbusRing() {
  const geometry = useMemo(() => {
    const geo = new THREE.TorusGeometry(LIMBUS_RADIUS, 0.2, 16, 64);
    geo.translate(0, 0, LIMBUS_Z);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.limbus}
        emissive={COLORS.limbus}
        emissiveIntensity={0.3}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}

export { LIMBUS_Z };
