import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';

interface NeedleTipProps {
  position: [number, number, number];
}

export function NeedleTip({ position }: NeedleTipProps) {
  const geometry = useMemo(() => {
    // Tapered cone/bevel tip
    const geo = new THREE.ConeGeometry(0.15, 1.5, 12);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, 0.75);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial
        color={COLORS.needleTip}
        metalness={0.9}
        roughness={0.1}
        emissive={COLORS.needleTip}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
