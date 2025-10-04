'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface LogoBlobProps {
  isAnimating: boolean;
}

function LogoBlob({ isAnimating }: LogoBlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create smaller blob for logo
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.8, 48, 48);
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
    mesh.rotation.x = time * (isAnimating ? 0.2 : 0.06);
    mesh.rotation.y = time * (isAnimating ? 0.25 : 0.1);
    mesh.rotation.z = time * (isAnimating ? 0.12 : 0.05);
    
    // Subtle blob morphing
    const positionAttribute = mesh.geometry.attributes.position;
    const originalPositions = mesh.geometry.userData.originalPositions as Float32Array;
    
    const morphIntensity = isAnimating ? 0.12 : 0.06;
    const speed = isAnimating ? 1 : 0.4;
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const i3 = i * 3;
      
      const x = originalPositions[i3];
      const y = originalPositions[i3 + 1];
      const z = originalPositions[i3 + 2];
      
      // Soft waves
      const wave = Math.sin(x * 2 + time * speed) * Math.cos(y * 2 + time * speed * 0.8) * morphIntensity;
      
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
    const pulse = 1 + Math.sin(time * (isAnimating ? 1.5 : 0.6)) * (isAnimating ? 0.06 : 0.03);
    mesh.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshTransmissionMaterial
        backside
        backsideThickness={0.4}
        samples={8}
        resolution={256}
        transmission={0.88}
        roughness={0.04}
        thickness={1.8}
        ior={1.5}
        chromaticAberration={isAnimating ? 0.3 : 0.1}
        anisotropy={0.4}
        distortion={isAnimating ? 0.6 : 0.2}
        distortionScale={isAnimating ? 1.2 : 0.4}
        temporalDistortion={isAnimating ? 0.5 : 0.12}
        clearcoat={1}
        clearcoatRoughness={0}
        attenuationDistance={0.7}
        attenuationColor="#D4C5F9"
        color="#E9D5FF"
        envMapIntensity={3.5}
        metalness={0}
        reflectivity={1}
      />
    </mesh>
  );
}

interface YummyLogoProps {
  isAnimating?: boolean;
  className?: string;
}

export function YummyLogo({ isAnimating = false, className = '' }: YummyLogoProps) {
  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Three.js Blob Background */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ 
            position: [0, 0, 3.5], 
            fov: 35,
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.6,
          }}
          dpr={[1, 2]}
          frameloop="always"
        >
          <Suspense fallback={null}>
            {/* Bright ambient light */}
            <ambientLight intensity={1.2} color="#F8FAFC" />
            
            {/* Key light - intense purple */}
            <directionalLight position={[3, 3, 3]} intensity={4} color="#8B5CF6" />
            
            {/* Fill light - intense blue */}
            <directionalLight position={[-3, -2, -3]} intensity={3.5} color="#3B82F6" />
            
            {/* Rim light - bright cyan accent */}
            <directionalLight position={[0, 5, -3]} intensity={3} color="#06B6D4" />
            
            {/* Accent point lights */}
            <pointLight position={[2, 1, 2]} intensity={4} color="#A78BFA" />
            <pointLight position={[-2, -1, -2]} intensity={3.5} color="#60A5FA" />
            <pointLight position={[0, -2, 1]} intensity={3} color="#C084FC" />
            
            {/* Environment */}
            <Environment resolution={256} background={false}>
              <mesh scale={100}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial side={THREE.BackSide}>
                  <primitive
                    attach="map"
                    object={(() => {
                      const canvas = document.createElement('canvas');
                      canvas.width = 256;
                      canvas.height = 256;
                      const ctx = canvas.getContext('2d')!;
                      
                      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
                      gradient.addColorStop(0, '#F5F3FF');
                      gradient.addColorStop(0.25, '#DDD6FE');
                      gradient.addColorStop(0.5, '#C4B5FD');
                      gradient.addColorStop(0.75, '#93C5FD');
                      gradient.addColorStop(1, '#EFF6FF');
                      
                      ctx.fillStyle = gradient;
                      ctx.fillRect(0, 0, 256, 256);
                      
                      const texture = new THREE.CanvasTexture(canvas);
                      texture.needsUpdate = true;
                      return texture;
                    })()}
                  />
                </meshBasicMaterial>
              </mesh>
            </Environment>
            
            {/* The Logo Blob */}
            <LogoBlob isAnimating={isAnimating} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* SVG Text Overlay - YUMMY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg 
          viewBox="0 0 140 80" 
          className="w-full h-full"
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3))',
          }}
        >
          {/* YUMMY Text */}
          <text
            x="70"
            y="48"
            textAnchor="middle"
            style={{
              fontSize: '24px',
              fontWeight: '800',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.5px',
            }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
              </linearGradient>
              
              {/* Shimmer animation gradient */}
              <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 0 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.8)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 0 }} />
                {isAnimating && (
                  <animateTransform
                    attributeName="x1"
                    from="-100%"
                    to="200%"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </linearGradient>
            </defs>
            
            {/* Text with gradient fill */}
            <tspan fill="url(#logoGradient)">YUMMY</tspan>
          </text>
          
          {/* Shimmer overlay when animating */}
          {isAnimating && (
            <text
              x="70"
              y="48"
              textAnchor="middle"
              style={{
                fontSize: '24px',
                fontWeight: '800',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.5px',
              }}
              fill="url(#shimmerGradient)"
              opacity="0.6"
            >
              YUMMY
            </text>
          )}
          
          {/* Decorative dots */}
          <circle cx="15" cy="44" r="2" fill="url(#logoGradient)" opacity="0.6">
            {isAnimating && (
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="125" cy="44" r="2" fill="url(#logoGradient)" opacity="0.6">
            {isAnimating && (
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
                begin="0.5s"
              />
            )}
          </circle>
        </svg>
      </div>
    </div>
  );
}
