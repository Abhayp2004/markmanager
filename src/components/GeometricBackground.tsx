import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);
  const shapesRef = useRef<THREE.Mesh[]>([]);
  
  const shapes = useMemo(() => {
    const items: { position: [number, number, number]; rotation: [number, number, number]; scale: number; type: 'icosahedron' | 'octahedron' | 'tetrahedron' }[] = [];
    const types: ('icosahedron' | 'octahedron' | 'tetrahedron')[] = ['icosahedron', 'octahedron', 'tetrahedron'];
    
    for (let i = 0; i < 15; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8 - 2
        ],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ],
        scale: 0.3 + Math.random() * 0.5,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
    
    shapesRef.current.forEach((mesh, i) => {
      if (mesh) {
        mesh.rotation.x += 0.003 + i * 0.0005;
        mesh.rotation.y += 0.002 + i * 0.0003;
        mesh.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
      }
    });
  });

  const getGeometry = (type: string) => {
    switch (type) {
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[1, 0]} />;
      default:
        return <icosahedronGeometry args={[1, 0]} />;
    }
  };

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) shapesRef.current[i] = el; }}
          position={shape.position}
          rotation={shape.rotation}
          scale={shape.scale}
        >
          {getGeometry(shape.type)}
          <meshStandardMaterial
            color={i % 3 === 0 ? '#0891b2' : i % 3 === 1 ? '#0284c7' : '#06b6d4'}
            transparent
            opacity={0.15 + (i % 5) * 0.05}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

function CentralRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0, -3]}>
      <torusGeometry args={[3, 0.02, 16, 100]} />
      <meshStandardMaterial
        color="#0891b2"
        transparent
        opacity={0.4}
        emissive="#0891b2"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -2]}>
      <planeGeometry args={[30, 30, 30, 30]} />
      <meshStandardMaterial
        color="#0e7490"
        transparent
        opacity={0.1}
        wireframe
      />
    </mesh>
  );
}

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#0891b2" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
        
        <FloatingShapes />
        <CentralRing />
        <GridPlane />
      </Canvas>
    </div>
  );
}
