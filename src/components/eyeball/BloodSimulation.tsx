import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

const MAX_PARTICLES = 50;

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

/**
 * BloodSimulation: particle-based bleeding effect at the RCM point
 * when the needle is inserted. Particles spawn and drip downward.
 */
export function BloodSimulation() {
  const pointsRef = useRef<THREE.Points>(null);
  const rcmPoint = useSimulationStore((s) => s.rcmPoint);
  const insertionDepth = useSimulationStore((s) => s.insertionDepth);

  const particles = useRef<Particle[]>([]);
  const lastSpawnTime = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  const posRef = useMemo(() => geometry.attributes.position, [geometry]);
  const colRef = useMemo(() => geometry.attributes.color, [geometry]);
  const sizeRef = useMemo(() => geometry.attributes.size, [geometry]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !rcmPoint || insertionDepth < 1) return;

    const now = performance.now();
    const spawnRate = Math.min(insertionDepth / 18, 1) * 10; // particles per second

    // Spawn new particles
    if (now - lastSpawnTime.current > 1000 / spawnRate && particles.current.length < MAX_PARTICLES) {
      lastSpawnTime.current = now;
      particles.current.push({
        position: new THREE.Vector3(
          rcmPoint[0] + (Math.random() - 0.5) * 0.5,
          rcmPoint[1] + (Math.random() - 0.5) * 0.5,
          rcmPoint[2] + (Math.random() - 0.5) * 0.5,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          -Math.random() * 0.5 - 0.2, // downward
          (Math.random() - 0.5) * 0.2,
        ),
        life: 0,
        maxLife: 1 + Math.random() * 2,
      });
    }

    // Update particles
    const positions = posRef.array as Float32Array;
    const colors = colRef.array as Float32Array;
    const sizes = sizeRef.array as Float32Array;

    // Remove dead particles
    particles.current = particles.current.filter((p) => {
      p.life += delta;
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= delta * 0.5; // gravity
      return p.life < p.maxLife;
    });

    /* eslint-disable react-hooks/immutability, @typescript-eslint/no-unnecessary-condition */
    // Update buffer - Three.js buffer attributes must be mutated directly
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles.current[i];
      if (p != null) {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;

        const lifeRatio = 1 - p.life / p.maxLife;
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.1 * lifeRatio;
        colors[i * 3 + 2] = 0.1 * lifeRatio;

        sizes[i] = 0.3 * lifeRatio;
      } else {
        sizes[i] = 0;
      }
    }

    posRef.needsUpdate = true;
    colRef.needsUpdate = true;
    sizeRef.needsUpdate = true;
    /* eslint-enable react-hooks/immutability, @typescript-eslint/no-unnecessary-condition */

    pointsRef.current.geometry.setDrawRange(0, Math.min(particles.current.length, MAX_PARTICLES));
  });

  if (!rcmPoint || insertionDepth < 1) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.3}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
