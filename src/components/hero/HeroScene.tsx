import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { BookmarkNodes } from './BookmarkNodes';
import { StreamLines } from './StreamLines';
import { CameraRig } from './CameraRig';
import { useScrollProgress } from './useScrollProgress';
import { usePointer } from './usePointer';
import { useIsMobile } from '@/hooks/use-mobile';

export function HeroScene() {
  const scrollProgress = useScrollProgress();
  const { pointer, smoothPointer } = usePointer();
  const isMobile = useIsMobile();

  const dpr = useMemo(() => (isMobile ? [1, 1.5] as [number, number] : [1, 2] as [number, number]), [isMobile]);

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ opacity: 1 - scrollProgress * 0.5 }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 8], fov: 55 }}
        dpr={dpr}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[8, 6, 8]} intensity={1.2} color="#0891b2" />
        <pointLight position={[-6, -4, -6]} intensity={0.6} color="#06b6d4" />
        <pointLight position={[0, 8, 0]} intensity={0.4} color="#0ea5e9" />

        <CameraRig
          pointer={pointer}
          smoothPointer={smoothPointer}
          scrollProgress={scrollProgress}
        />
        <BookmarkNodes
          pointer={pointer}
          scrollProgress={scrollProgress}
          isMobile={isMobile}
        />
        {!isMobile && (
          <StreamLines scrollProgress={scrollProgress} isMobile={isMobile} />
        )}

        <fog attach="fog" args={['#0a1520', 8, 20]} />
      </Canvas>
    </div>
  );
}
