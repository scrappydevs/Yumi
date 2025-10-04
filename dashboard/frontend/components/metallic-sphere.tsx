'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface SphereProps {
  isActive: boolean;
}

function MetallicSphere({ isActive }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1.2, 64, 64);
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
      <MeshTransmissionMaterial
        backside
        backsideThickness={0.5}
        samples={10}
        resolution={512}
        transmission={0.85}
        roughness={0.05}
        thickness={2}
        ior={1.5}
        chromaticAberration={0.05}
        anisotropy={0.3}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.08}
        clearcoat={1}
        clearcoatRoughness={0}
        attenuationDistance={1}
        attenuationColor="#F5F3FF"
        color="#FFFFFF"
        envMapIntensity={4.5}
        metalness={0}
        reflectivity={1}
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
          position: [0, 0, 4], 
          fov: 35,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 2.5,
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          {/* Very bright ambient light */}
          <ambientLight intensity={2.5} color="#FFFFFF" />
          
          {/* Key light - ultra intense purple */}
          <directionalLight position={[5, 5, 5]} intensity={6} color="#8B5CF6" />
          
          {/* Fill light - ultra intense blue */}
          <directionalLight position={[-5, -3, -5]} intensity={5.5} color="#3B82F6" />
          
          {/* Rim light - super bright cyan accent */}
          <directionalLight position={[0, 10, -5]} intensity={5} color="#06B6D4" />
          
          {/* Accent point lights - ultra vibrant purple and blue gradient */}
          <pointLight position={[4, 2, 4]} intensity={6} color="#A78BFA" />
          <pointLight position={[-4, -2, -4]} intensity={5.5} color="#60A5FA" />
          <pointLight position={[0, -4, 2]} intensity={5.5} color="#C084FC" />
          <pointLight position={[2, 4, -2]} intensity={5.5} color="#38BDF8" />
          <pointLight position={[0, 0, 5]} intensity={4} color="#DDD6FE" />
          
          {/* Apple-style white environment with purple-blue gradient hints */}
          <Environment resolution={512} background={false}>
            <mesh scale={100}>
              <sphereGeometry args={[1, 64, 64]} />
              <meshBasicMaterial side={THREE.BackSide}>
                <primitive
                  attach="map"
                  object={(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d')!;
                    
                    // Create vibrant gradient: purple-blue with high contrast
                    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
                    gradient.addColorStop(0, '#F5F3FF');    // Light purple top
                    gradient.addColorStop(0.25, '#DDD6FE'); // Vibrant purple
                    gradient.addColorStop(0.5, '#C4B5FD');  // Strong purple
                    gradient.addColorStop(0.75, '#93C5FD'); // Strong blue
                    gradient.addColorStop(1, '#EFF6FF');    // Light blue bottom
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 512, 512);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.needsUpdate = true;
                    return texture;
                  })()}
                />
              </meshBasicMaterial>
            </mesh>
          </Environment>
          
          {/* The Sphere */}
          <MetallicSphere isActive={isActive} />
        </Suspense>
      </Canvas>
    </div>
  );
}

