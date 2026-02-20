import { useFrame, useThree } from '@react-three/fiber';

interface CameraRigProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  smoothPointer: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgress: number;
}

export function CameraRig({ pointer, smoothPointer, scrollProgress }: CameraRigProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Smooth pointer follow
    smoothPointer.current.x += (pointer.current.x - smoothPointer.current.x) * 0.04;
    smoothPointer.current.y += (pointer.current.y - smoothPointer.current.y) * 0.04;

    // Cinematic camera: orbit slightly with pointer, dolly on scroll
    const targetX = smoothPointer.current.x * 1.2;
    const targetY = smoothPointer.current.y * 0.8 + 0.3;
    const targetZ = 7 - scrollProgress * 4;

    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;

    camera.lookAt(0, scrollProgress * -0.5, -2);
  });

  return null;
}
