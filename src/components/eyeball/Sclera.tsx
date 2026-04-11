import * as THREE from 'three';
import { useMemo } from 'react';
import { EYEBALL_RADIUS, COLORS } from '../../constants';
import { SCLERA_FRONT_CUT_ANGLE } from './Cornea';

/**
 * Sclera: outer white sphere with front cap removed + inner dark sphere.
 *
 * The front cap is cut out (thetaStart = SCLERA_FRONT_CUT_ANGLE) so the
 * iris and pupil are visible through the cornea opening.
 *
 * Rendering:
 *   1. Inner dark sphere (BackSide) — dark backdrop visible through cornea
 *   2. Outer sclera body (FrontSide) — white eyeball, front cap is missing
 */
const INTERIOR_RADIUS = EYEBALL_RADIUS - 0.5;

export function Sclera() {
  const outerGeometry = useMemo(() => {
    // Sphere with front cap cut out: thetaStart skips the front region
    // thetaStart is measured from +Y pole; after rotation -X 90°, +Y → +Z
    // So the front cap (around +Z) is skipped
    return new THREE.SphereGeometry(
      EYEBALL_RADIUS,
      64,
      64,
      0,
      Math.PI * 2,
      SCLERA_FRONT_CUT_ANGLE,
      Math.PI - SCLERA_FRONT_CUT_ANGLE
    );
  }, []);

  const innerGeometry = useMemo(() => {
    return new THREE.SphereGeometry(INTERIOR_RADIUS, 48, 48);
  }, []);

  return (
    <>
      {/* Dark interior — BackSide renders the inside surface */}
      <mesh geometry={innerGeometry}>
        <meshStandardMaterial
          color={COLORS.interior}
          roughness={0.95}
          metalness={0.0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer opaque sclera body — front cap is cut out */}
      <mesh geometry={outerGeometry}>
        <meshPhysicalMaterial
          color={COLORS.sclera}
          roughness={0.3}
          metalness={0.0}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          side={THREE.FrontSide}
        />
      </mesh>
    </>
  );
}
