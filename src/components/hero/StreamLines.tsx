import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StreamLinesProps {
  scrollProgress: number;
  isMobile: boolean;
}

export function StreamLines({ scrollProgress, isMobile }: StreamLinesProps) {
  const linesRef = useRef<THREE.Group>(null);
  const lineCount = isMobile ? 6 : 14;

  const curves = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => {
      const pts: THREE.Vector3[] = [];
      const startAngle = (i / lineCount) * Math.PI * 2;
      const radius = 4 + Math.random() * 3;
      for (let j = 0; j <= 40; j++) {
        const t = j / 40;
        const angle = startAngle + t * Math.PI * 0.8;
        pts.push(
          new THREE.Vector3(
            Math.cos(angle) * radius * (1 - t * 0.3),
            Math.sin(angle) * radius * (1 - t * 0.3) + (t - 0.5) * 2,
            -2 + t * 3 - Math.sin(t * Math.PI) * 2
          )
        );
      }
      return new THREE.CatmullRomCurve3(pts);
    });
  }, [lineCount]);

  useFrame((state) => {
    if (!linesRef.current) return;
    const t = state.clock.elapsedTime;
    linesRef.current.rotation.z = t * 0.02;
    linesRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
    linesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const mat = child.material as THREE.LineBasicMaterial;
        mat.opacity = 0.12 + Math.sin(t * 0.5 + i) * 0.06 - scrollProgress * 0.1;
      }
    });
  });

  return (
    <group ref={linesRef}>
      {curves.map((curve, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={41}
              array={new Float32Array(curve.getPoints(40).flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={i % 2 === 0 ? '#0891b2' : '#06b6d4'}
            transparent
            opacity={0.15}
            linewidth={1}
          />
        </line>
      ))}
    </group>
  );
}
