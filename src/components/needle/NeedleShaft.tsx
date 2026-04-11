import * as THREE from 'three';
import { useMemo } from 'react';
import { COLORS } from '../../constants';

interface NeedleShaftProps {
  length: number;
  offset?: number;
}

export function NeedleShaft({ length, offset = 0 }: NeedleShaftProps) {
  const clampedLength = Math.max(0.1, length);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.15, 0.15, clampedLength, 12);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, offset);
    return geo;
  }, [clampedLength, offset]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.needleShaft}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
