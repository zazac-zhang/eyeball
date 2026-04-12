import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { MAX_TILT_ANGLE, COLORS } from '../../constants';

/**
 * SafetyCone: visualizes the maximum tilt angle constraint as a cone.
 *
 * The RCM constraint means the needle shaft must always pass through the
 * RCM point. The maximum tilt angle (45°) defines a cone-shaped safety
 * region — the needle can tilt within this cone but not beyond it.
 *
 * Visual: a semi-transparent yellow cone with its apex at the RCM point,
 * extending along the surface normal direction.
 */
export function SafetyCone() {
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const surfaceNormal = useSimulationStore((s) => s.surfaceNormal);

  const cone = useMemo(() => {
    if (!rcmPoint || !surfaceNormal) return null;

    // Cone geometry: height = 20mm (arbitrary, long enough to be visible)
    // radius = height * tan(MAX_TILT_ANGLE)
    const height = 20;
    const radius = height * Math.tan(MAX_TILT_ANGLE);

    // Create cone geometry (apex at origin, pointing along +Y)
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);

    // Translate so apex is at origin
    geometry.translate(0, -height / 2, 0);

    // Create mesh with transparent material
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.rcmIndicator,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position at RCM point
    mesh.position.set(...rcmPoint);

    // Orient along the surface normal
    const normal = new THREE.Vector3(...surfaceNormal).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, normal);

    return mesh;
  }, [rcmPoint, surfaceNormal]);

  if (!cone) return null;

  return <primitive object={cone} />;
}
