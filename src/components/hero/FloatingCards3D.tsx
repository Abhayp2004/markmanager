import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

function FloatingCard({
  position,
  rotation,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = initialY + Math.sin(t * speed + position[0]) * 0.4;
    meshRef.current.rotation.x = rotation[0] + Math.sin(t * speed * 0.5) * 0.15;
    meshRef.current.rotation.y = rotation[1] + t * speed * 0.2;
    meshRef.current.rotation.z = rotation[2] + Math.cos(t * speed * 0.3) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1.6, 1, 0.08]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.15}
        emissive={color}
        emissiveIntensity={0.4}
        roughness={0.3}
        metalness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FloatingIcons() {
  const groupRef = useRef<THREE.Group>(null);

  const items = useMemo(() => {
    const shapes: {
      pos: [number, number, number];
      rot: [number, number, number];
      scale: number;
      color: string;
      speed: number;
      type: 'card' | 'sphere' | 'diamond';
    }[] = [
      { pos: [-3.5, 1.5, -2], rot: [0.3, 0.5, 0.1], scale: 0.7, color: '#0891b2', speed: 0.6, type: 'card' },
      { pos: [3.8, -0.5, -3], rot: [-0.2, -0.3, 0.2], scale: 0.6, color: '#06b6d4', speed: 0.5, type: 'card' },
      { pos: [-2, -2, -1.5], rot: [0.5, 0.2, -0.3], scale: 0.5, color: '#14b8a6', speed: 0.7, type: 'card' },
      { pos: [2.5, 2.5, -4], rot: [0.1, -0.5, 0.4], scale: 0.55, color: '#0ea5e9', speed: 0.45, type: 'card' },
      { pos: [0, -3, -2], rot: [0.4, 0.1, 0.2], scale: 0.4, color: '#0891b2', speed: 0.55, type: 'diamond' },
      { pos: [-4, -0.5, -3.5], rot: [0, 0, 0], scale: 0.25, color: '#06b6d4', speed: 0.8, type: 'sphere' },
      { pos: [4.5, 1, -2.5], rot: [0, 0, 0], scale: 0.2, color: '#14b8a6', speed: 0.65, type: 'sphere' },
    ];
    return shapes;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => {
        if (item.type === 'card') {
          return (
            <FloatingCard
              key={i}
              position={item.pos}
              rotation={item.rot}
              scale={item.scale}
              color={item.color}
              speed={item.speed}
            />
          );
        }
        if (item.type === 'sphere') {
          return (
            <FloatingSphere
              key={i}
              position={item.pos}
              scale={item.scale}
              color={item.color}
              speed={item.speed}
            />
          );
        }
        return (
          <FloatingDiamond
            key={i}
            position={item.pos}
            rotation={item.rot}
            scale={item.scale}
            color={item.color}
            speed={item.speed}
          />
        );
      })}
    </group>
  );
}

function FloatingSphere({
  position,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = initialY + Math.sin(t * speed) * 0.5;
    const s = scale + Math.sin(t * speed * 1.5) * 0.03;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.2}
        emissive={color}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

function FloatingDiamond({
  position,
  rotation,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = initialY + Math.sin(t * speed) * 0.35;
    ref.current.rotation.y = t * speed * 0.5;
    ref.current.rotation.x = rotation[0] + Math.sin(t * 0.3) * 0.2;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.2}
        emissive={color}
        emissiveIntensity={0.8}
        wireframe
      />
    </mesh>
  );
}

export function FloatingCards3DScene() {
  const isMobile = useIsMobile();

  if (isMobile) return null; // Skip on mobile for performance

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#0891b2" distance={20} decay={2} />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="#06b6d4" distance={15} decay={2} />
        <FloatingIcons />
        <fog attach="fog" args={['#050d14', 8, 25]} />
      </Canvas>
    </div>
  );
}
