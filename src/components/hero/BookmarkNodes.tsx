import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT_DESKTOP = 120;
const NODE_COUNT_MOBILE = 50;

interface BookmarkNodesProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgress: number;
  isMobile: boolean;
}

export function BookmarkNodes({ pointer, scrollProgress, isMobile }: BookmarkNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = isMobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;

  const { particles, baseColors } = useMemo(() => {
    const p: { pos: THREE.Vector3; vel: THREE.Vector3; phase: number; radius: number }[] = [];
    const colors: THREE.Color[] = [];
    const palette = [
      new THREE.Color().setHSL(0.52, 0.72, 0.40), // primary teal
      new THREE.Color().setHSL(0.53, 0.85, 0.45), // accent cyan
      new THREE.Color().setHSL(0.56, 0.60, 0.50), // blue
      new THREE.Color().setHSL(0.48, 0.50, 0.55), // lighter teal
      new THREE.Color().setHSL(0.60, 0.40, 0.35), // deeper blue
    ];

    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p.push({
        pos: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi) - 2
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002
        ),
        phase: Math.random() * Math.PI * 2,
        radius,
      });
      colors.push(palette[Math.floor(Math.random() * palette.length)].clone());
    }
    return { particles: p, baseColors: colors };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const px = pointer.current.x;
    const py = pointer.current.y;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Orbital drift
      p.pos.x += Math.sin(t * 0.3 + p.phase) * 0.003 + p.vel.x;
      p.pos.y += Math.cos(t * 0.25 + p.phase * 1.3) * 0.003 + p.vel.y;
      p.pos.z += Math.sin(t * 0.2 + p.phase * 0.7) * 0.002 + p.vel.z;

      // Pointer repulsion
      const dx = p.pos.x - px * 4;
      const dy = p.pos.y - py * 4;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2.5) {
        const force = (2.5 - dist) * 0.015;
        p.pos.x += (dx / dist) * force;
        p.pos.y += (dy / dist) * force;
      }

      // Scroll: contract toward center
      const scrollFactor = 1 - scrollProgress * 0.6;
      const scale = 0.04 + Math.sin(t + p.phase) * 0.015;

      dummy.position.set(
        p.pos.x * scrollFactor,
        p.pos.y * scrollFactor,
        p.pos.z * scrollFactor - scrollProgress * 4
      );
      dummy.scale.setScalar(scale * (1 + (dist < 2 ? (2 - dist) * 0.3 : 0)));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color: glow near pointer
      const glow = dist < 2.5 ? (2.5 - dist) / 2.5 : 0;
      tempColor.copy(baseColors[i]);
      tempColor.lerp(new THREE.Color(0.2, 0.9, 1.0), glow * 0.6);
      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    const geo = meshRef.current.geometry;
    geo.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.7}
        roughness={0.3}
        metalness={0.5}
        emissive={new THREE.Color().setHSL(0.52, 0.72, 0.15)}
        emissiveIntensity={0.4}
      />
    </instancedMesh>
  );
}
