import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';
import { useForceFeedback } from '../../hooks/useForceFeedback';

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

  const { force, color } = useForceFeedback();

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial
        color={force > 0.01 ? color : COLORS.needleTip}
        metalness={0.9}
        roughness={0.1}
        emissive={force > 0.01 ? color : COLORS.needleTip}
        emissiveIntensity={0.1 + force * 0.5}
      />
    </mesh>
  );
}
