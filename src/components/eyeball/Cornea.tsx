import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';

/**
 * Cornea: transparent spherical cap protruding from the front of the eyeball.
 *
 * The cornea dome is a SphereGeometry cap (r=5, 60°) centered at z=7.
 * Its front pole sits exactly at the eyeball surface (z=12).
 *
 * Layout (z-axis, front to back):
 *   z=12        ← eyeball surface / cornea front pole
 *   z=11.7      ← iris ring (just behind surface, visible through cornea)
 *   z=11.65     ← pupil (dark center)
 *   z=10        ← inner dark sphere back wall
 *   z=7–12      ← cornea transparent dome
 */
const CORNEA_RADIUS_CURVATURE = 5;
const EYEBALL_FRONT = EYEBALL_RADIUS;
const CORNEA_CENTER_Z = EYEBALL_FRONT - CORNEA_RADIUS_CURVATURE;
const CORNEA_CAP_ANGLE = Math.PI / 3; // 60°

// Limbus: cornea-sclera boundary
const LIMBUS_Z = CORNEA_CENTER_Z + CORNEA_RADIUS_CURVATURE * Math.cos(CORNEA_CAP_ANGLE);
const CORNEA_EDGE_RADIUS = CORNEA_RADIUS_CURVATURE * Math.sin(CORNEA_CAP_ANGLE);
const EYEBALL_WIDTH_AT_LIMBUS = Math.sqrt(
  EYEBALL_RADIUS * EYEBALL_RADIUS - LIMBUS_Z * LIMBUS_Z
);
const LIMBUS_RADIUS = (CORNEA_EDGE_RADIUS + EYEBALL_WIDTH_AT_LIMBUS) / 2;

// Iris: visible through the transparent cornea
const IRIS_Z = EYEBALL_FRONT - 0.3; // z=11.7 — very close to surface
const IRIS_OUTER_RADIUS = EYEBALL_RADIUS * 0.38;
const IRIS_INNER_RADIUS = IRIS_OUTER_RADIUS * 0.35;

// The sclera front-cap angle: how much of the front is "cut out" for the cornea
// Must be >= CORNEA_CAP_ANGLE so the cornea opening is fully exposed
const SCLERA_FRONT_CUT_ANGLE = CORNEA_CAP_ANGLE + 0.05; // ~63°

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
    <>
      {/* Iris — colored ring on the front of the eyeball */}
      <mesh position={[0, 0, IRIS_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[IRIS_INNER_RADIUS, IRIS_OUTER_RADIUS, 64]} />
        <meshStandardMaterial
          color={COLORS.iris}
          emissive={COLORS.iris}
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Pupil — dark circular center */}
      <mesh position={[0, 0, IRIS_Z - 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[IRIS_INNER_RADIUS, 32]} />
        <meshStandardMaterial
          color="#050510"
          side={THREE.DoubleSide}
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>

      {/* Transparent cornea dome */}
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
    </>
  );
}

export { LIMBUS_Z, LIMBUS_RADIUS, SCLERA_FRONT_CUT_ANGLE };
