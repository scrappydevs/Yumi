'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment } from '@react-three/drei';
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
        transmission={1}
        roughness={0}
        thickness={1.8}
        ior={1.5}
        chromaticAberration={isAnimating ? 0.2 : 0.06}
        anisotropy={0.3}
        distortion={isAnimating ? 0.4 : 0.12}
        distortionScale={isAnimating ? 0.8 : 0.25}
        temporalDistortion={isAnimating ? 0.3 : 0.08}
        clearcoat={1}
        clearcoatRoughness={0}
        attenuationDistance={1}
        attenuationColor="#FFE5F5"
        color="#FFF0FA"
        envMapIntensity={2.5}
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

export function LiquidGlassBlob({ isAnimating = false, className = '' }: LiquidGlassBlobProps) {
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
          {/* Apple-style lighting - pink and blue */}
          <ambientLight intensity={0.8} color="#FFF5FA" />
          
          {/* Key light - soft pink */}
          <directionalLight position={[5, 5, 5]} intensity={2.5} color="#FF6B9D" />
          
          {/* Fill light - Apple blue */}
          <directionalLight position={[-5, -3, -5]} intensity={2} color="#007AFF" />
          
          {/* Rim light - bright blue accent */}
          <directionalLight position={[0, 10, -5]} intensity={2} color="#5AC8FA" />
          
          {/* Accent point lights - pink and blue gradient */}
          <pointLight position={[4, 2, 4]} intensity={2} color="#FF375F" />
          <pointLight position={[-4, -2, -4]} intensity={1.8} color="#0A84FF" />
          <pointLight position={[0, -4, 2]} intensity={1.5} color="#FF9ECD" />
          <pointLight position={[2, 4, -2]} intensity={1.5} color="#64D2FF" />
          
          {/* Environment for realistic glass reflections */}
          <Environment preset="sunset" background={false} />
          
          {/* The Blob */}
          <Blob isAnimating={isAnimating} />
        </Suspense>
      </Canvas>
    </div>
  );
}

