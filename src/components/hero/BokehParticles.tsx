import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT_DESKTOP = 250;
const COUNT_MOBILE = 100;

interface BokehParticlesProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgress: number;
  isMobile: boolean;
}

// Generate a soft circle texture for bokeh look
function createBokehTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  // Radial gradient: bright center → soft edge
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.15, 'rgba(200,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(100,200,220,0.3)');
  gradient.addColorStop(0.7, 'rgba(50,150,180,0.08)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function BokehParticles({ pointer, scrollProgress, isMobile }: BokehParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = isMobile ? COUNT_MOBILE : COUNT_DESKTOP;

  const bokehTexture = useMemo(() => createBokehTexture(), []);

  const { initPositions, velocities, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const spread = Math.pow(Math.random(), 0.5) * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = spread * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = spread * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = spread * Math.cos(phi) * 0.6 - 4;

      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;

      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.3 + Math.pow(Math.random(), 1.5) * 2.5;
    }
    return { initPositions: pos, velocities: vel, phases: ph, sizes: sz };
  }, [count]);

  const positions = useMemo(() => new Float32Array(initPositions), [initPositions]);
  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    const palette = [
      [0.03, 0.57, 0.70],
      [0.024, 0.65, 0.85],
      [0.055, 0.72, 0.91],
      [0.08, 0.82, 0.96],
      [0.02, 0.40, 0.58],
      [0.45, 0.30, 0.85],
    ];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return col;
  }, [count]);

  const sizesAttr = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) s[i] = sizes[i];
    return s;
  }, [count, sizes]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    const px = pointer.current.x;
    const py = pointer.current.y;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Gentle orbital drift
      posAttr.array[i3] += Math.sin(t * 0.3 + phase) * 0.003 + velocities[i3];
      posAttr.array[i3 + 1] += Math.cos(t * 0.25 + phase * 1.3) * 0.003 + velocities[i3 + 1];
      posAttr.array[i3 + 2] += Math.sin(t * 0.2 + phase * 0.7) * 0.002 + velocities[i3 + 2];

      // Pointer repulsion
      const dx = posAttr.array[i3] - px * 5;
      const dy = posAttr.array[i3 + 1] - py * 3;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        const force = (3 - dist) * 0.008;
        posAttr.array[i3] += (dx / dist) * force;
        posAttr.array[i3 + 1] += (dy / dist) * force;
      }

      // Soft boundary - pull back toward origin
      const ox = posAttr.array[i3];
      const oy = posAttr.array[i3 + 1];
      const oz = posAttr.array[i3 + 2];
      const r = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (r > 14) {
        posAttr.array[i3] *= 0.99;
        posAttr.array[i3 + 1] *= 0.99;
        posAttr.array[i3 + 2] *= 0.99;
      }
    }

    posAttr.needsUpdate = true;

    // Slow rotation of entire system
    pointsRef.current.rotation.y = t * 0.015;
    pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        sizeAttenuation
        transparent
        opacity={0.85}
        vertexColors
        map={bokehTexture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
