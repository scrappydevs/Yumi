'use client';

import { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface BlobProps {
  isAnimating: boolean;
}

function Blob({ isAnimating }: BlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create sphere geometry - ultra-high subdivision for perfectly smooth blob
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.5, 64, 64);
    const positionAttribute = geo.attributes.position;
    
    // Store original positions for animation
    const originalPositions = new Float32Array(positionAttribute.array);
    geo.userData.originalPositions = originalPositions;
    
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const time = state.clock.getElapsedTime();
    
    // Gentle rotation
    mesh.rotation.x = time * (isAnimating ? 0.15 : 0.05);
    mesh.rotation.y = time * (isAnimating ? 0.2 : 0.08);
    mesh.rotation.z = time * (isAnimating ? 0.1 : 0.04);
    
    // Subtle blob morphing
    const positionAttribute = mesh.geometry.attributes.position;
    const originalPositions = mesh.geometry.userData.originalPositions as Float32Array;
    
    const morphIntensity = isAnimating ? 0.15 : 0.08;
    const speed = isAnimating ? 0.8 : 0.3;
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const i3 = i * 3;
      
      const x = originalPositions[i3];
      const y = originalPositions[i3 + 1];
      const z = originalPositions[i3 + 2];
      
      // Soft waves
      const wave = Math.sin(x + time * speed) * Math.cos(y + time * speed * 0.8) * morphIntensity;
      
      const length = Math.sqrt(x * x + y * y + z * z);
      const scale = 1 + wave;
      
      positionAttribute.setXYZ(
        i,
        (x / length) * scale,
        (y / length) * scale,
        (z / length) * scale
      );
    }
    
    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    
    // Gentle breathing
    const pulse = 1 + Math.sin(time * (isAnimating ? 1.2 : 0.5)) * (isAnimating ? 0.05 : 0.02);
    mesh.scale.setScalar(pulse);
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
        thickness={2.5}
        ior={1.5}
        chromaticAberration={isAnimating ? 0.25 : 0.08}
        anisotropy={0.4}
        distortion={isAnimating ? 0.5 : 0.15}
        distortionScale={isAnimating ? 1 : 0.3}
        temporalDistortion={isAnimating ? 0.4 : 0.1}
        clearcoat={1}
        clearcoatRoughness={0}
        attenuationDistance={0.8}
        attenuationColor="#D4C5F9"
        color="#E9D5FF"
        envMapIntensity={3}
        metalness={0}
        reflectivity={1}
      />
    </mesh>
  );
}

interface LiquidGlassBlobProps {
  isAnimating?: boolean;
  className?: string;
}

function GradientEnvironment() {
  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
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
  }, []);

  if (!texture) return null;

  return (
    <Environment resolution={256} background={false}>
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <primitive attach="map" object={texture} />
        </meshBasicMaterial>
      </mesh>
    </Environment>
  );
}

export function LiquidGlassBlob({ isAnimating = false, className = '' }: LiquidGlassBlobProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={`w-full h-full ${className}`} />;

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0, 5.5], 
          fov: 28,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.8,
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          {/* Bright ambient light */}
          <ambientLight intensity={1.5} color="#F8FAFC" />
          
          {/* Key light - intense purple */}
          <directionalLight position={[5, 5, 5]} intensity={5} color="#8B5CF6" />
          
          {/* Fill light - intense blue */}
          <directionalLight position={[-5, -3, -5]} intensity={4.5} color="#3B82F6" />
          
          {/* Rim light - bright cyan accent */}
          <directionalLight position={[0, 10, -5]} intensity={4} color="#06B6D4" />
          
          {/* Accent point lights - vibrant purple and blue gradient */}
          <pointLight position={[4, 2, 4]} intensity={5} color="#A78BFA" />
          <pointLight position={[-4, -2, -4]} intensity={4.5} color="#60A5FA" />
          <pointLight position={[0, -4, 2]} intensity={4} color="#C084FC" />
          <pointLight position={[2, 4, -2]} intensity={4} color="#38BDF8" />
          <pointLight position={[-2, 3, 3]} intensity={3.5} color="#DDD6FE" />
          <pointLight position={[3, -3, -2]} intensity={3.5} color="#BFDBFE" />
          
          {/* Apple-style white environment with purple-blue gradient hints */}
          <Environment resolution={256} background={false}>
            <mesh scale={100}>
              <sphereGeometry args={[1, 64, 64]} />
              <meshBasicMaterial side={THREE.BackSide}>
                {typeof window !== 'undefined' && (
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
                )}
              </meshBasicMaterial>
            </mesh>
          </Environment>
          
          {/* The Blob */}
          <Blob isAnimating={isAnimating} />
        </Suspense>
      </Canvas>
    </div>
  );
}

