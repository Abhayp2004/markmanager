import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { BokehParticles } from './BokehParticles';
import { OrbitalRings } from './OrbitalRings';
import { CentralOrb } from './CentralOrb';
import { CameraRig } from './CameraRig';
import { useScrollProgress } from './useScrollProgress';
import { usePointer } from './usePointer';
import { useIsMobile } from '@/hooks/use-mobile';

export function HeroScene() {
  const scrollProgress = useScrollProgress();
  const { pointer, smoothPointer } = usePointer();
  const isMobile = useIsMobile();

  const dpr = useMemo(
    () => (isMobile ? [1, 1.5] as [number, number] : [1, 2] as [number, number]),
    [isMobile]
  );

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ opacity: 1 - scrollProgress * 0.35 }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 7], fov: 50 }}
        dpr={dpr}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        {/* Subtle ambient + dramatic point lights */}
        <ambientLight intensity={0.08} />
        <pointLight position={[8, 5, 8]} intensity={1.5} color="#0891b2" distance={30} decay={2} />
        <pointLight position={[-6, -4, -6]} intensity={1} color="#06b6d4" distance={25} decay={2} />
        <pointLight position={[0, 8, 0]} intensity={0.8} color="#0ea5e9" distance={20} decay={2} />

        <CameraRig
          pointer={pointer}
          smoothPointer={smoothPointer}
          scrollProgress={scrollProgress}
        />

        {/* Scene elements — pushed back for depth */}
        <CentralOrb />
        {!isMobile && <OrbitalRings />}

        <BokehParticles
          pointer={pointer}
          scrollProgress={scrollProgress}
          isMobile={isMobile}
        />

        <fog attach="fog" args={['#050d14', 10, 30]} />
      </Canvas>
    </div>
  );
}
