import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  smoothPointer: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgress: number;
}

export function CameraRig({ pointer, smoothPointer, scrollProgress }: CameraRigProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Smooth pointer follow
    smoothPointer.current.x += (pointer.current.x - smoothPointer.current.x) * 0.05;
    smoothPointer.current.y += (pointer.current.y - smoothPointer.current.y) * 0.05;

    // Camera position: slight pan on pointer, dolly on scroll
    const targetX = smoothPointer.current.x * 0.8;
    const targetY = smoothPointer.current.y * 0.5 + 0.5;
    const targetZ = 8 - scrollProgress * 3;

    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z += (targetZ - camera.position.z) * 0.03;

    // Look slightly ahead of center
    camera.lookAt(0, scrollProgress * -1, -2);
  });

  return null;
}
