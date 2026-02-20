import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null);

  const rings = useMemo(() => [
    { radius: 2.0, tube: 0.008, tilt: [0.4, 0, 0] as [number, number, number], speed: 0.12, color: '#0891b2', emissiveIntensity: 1.2, opacity: 0.25 },
    { radius: 2.8, tube: 0.006, tilt: [0.9, 0.4, 0.2] as [number, number, number], speed: -0.08, color: '#06b6d4', emissiveIntensity: 1.0, opacity: 0.2 },
    { radius: 3.5, tube: 0.005, tilt: [1.3, 0.9, 0.5] as [number, number, number], speed: 0.06, color: '#0ea5e9', emissiveIntensity: 0.8, opacity: 0.15 },
    { radius: 1.4, tube: 0.007, tilt: [0.6, 1.6, 0] as [number, number, number], speed: -0.15, color: '#14b8a6', emissiveIntensity: 1.5, opacity: 0.3 },
  ], []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.025;
    groupRef.current.children.forEach((child, i) => {
      if (i < rings.length) {
        child.rotation.z = t * rings[i].speed;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -1, -8]}>
      {rings.map((r, i) => (
        <mesh key={i} rotation={r.tilt}>
          <torusGeometry args={[r.radius, r.tube, 32, 128]} />
          <meshStandardMaterial
            color={r.color}
            transparent
            opacity={r.opacity}
            emissive={r.color}
            emissiveIntensity={r.emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
