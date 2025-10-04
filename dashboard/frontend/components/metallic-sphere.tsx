'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface SphereProps {
  isActive: boolean;
}

function MetallicSphere({ isActive }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(0.8, 32, 32);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Very slow, subtle rotation
    meshRef.current.rotation.y = time * 0.1;
    
    // Gentle breathing
    const pulse = 1 + Math.sin(time * 0.8) * 0.02;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={isActive ? "#A0B0D0" : "#C0C0D0"}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

interface MetallicSphereProps {
  isActive?: boolean;
  className?: string;
}

export function MetallicSphereComponent({ isActive = false, className = '' }: MetallicSphereProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0, 3], 
          fov: 35,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={1}
        frameloop="always"
      >
        <Suspense fallback={null}>
          {/* Simple lighting for metallic look */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[2, 2, 2]} intensity={0.8} color="#ffffff" />
          <directionalLight position={[-1, -1, -1]} intensity={0.3} color="#E0E8F0" />
          
          {/* Environment for metallic reflections */}
          <Environment preset="city" background={false} />
          
          {/* The Sphere */}
          <MetallicSphere isActive={isActive} />
        </Suspense>
      </Canvas>
    </div>
  );
}

