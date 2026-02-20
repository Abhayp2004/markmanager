import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CentralOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.3;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.25;
      innerRef.current.rotation.z = t * 0.1;
    }
    if (glowRef.current) {
      const s = 1.5 + Math.sin(t * 0.4) * 0.15;
      glowRef.current.scale.setScalar(s);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 0.6) * 0.03;
    }
  });

  return (
    <group position={[0, -1, -8]}>
      {/* Wireframe icosahedron — smaller, pushed back */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial
          color="#0891b2"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Inner solid sphere */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.3, 3]} />
        <meshStandardMaterial
          color="#14b8a6"
          emissive="#06b6d4"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#0891b2"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
