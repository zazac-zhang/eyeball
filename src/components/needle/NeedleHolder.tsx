import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';

interface NeedleHolderProps {
  position: [number, number, number];
}

/**
 * Needle holder — robotic gripper that holds the needle shaft.
 *
 * Modeled as a cylindrical housing with two gripping jaws. The holder
 * is positioned at the proximal end of the needle (outside the eyeball).
 */
export function NeedleHolder({ position }: NeedleHolderProps) {
  const bodyGeometry = useMemo(() => {
    // Main cylindrical body
    const geo = new THREE.CylinderGeometry(0.4, 0.5, 3, 16);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, -1.5);
    return geo;
  }, []);

  const upperJawGeometry = useMemo(() => {
    // Upper jaw
    const geo = new THREE.BoxGeometry(0.3, 0.8, 1.5);
    geo.translate(0, 0.25, 0.75);
    return geo;
  }, []);

  const lowerJawGeometry = useMemo(() => {
    // Lower jaw
    const geo = new THREE.BoxGeometry(0.3, 0.8, 1.5);
    geo.translate(0, -0.25, 0.75);
    return geo;
  }, []);

  return (
    <group position={position}>
      {/* Main body */}
      <mesh geometry={bodyGeometry}>
        <meshStandardMaterial
          color={COLORS.needleHolder}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Upper jaw */}
      <mesh geometry={upperJawGeometry}>
        <meshStandardMaterial
          color={COLORS.needleHolder}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Lower jaw */}
      <mesh geometry={lowerJawGeometry}>
        <meshStandardMaterial
          color={COLORS.needleHolder}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Grip lines for visual detail */}
      <group position={[0, 0, 0.2]}>
        {[0, 0.3, 0.6, 0.9].map((offset, index) => (
          <mesh key={index} position={[0, 0, offset]}>
            <torusGeometry args={[0.35, 0.02, 8, 32]} />
            <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
