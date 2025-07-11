'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from './MemoryText';

// Blob Tracking コンポーネント
function BlobTracker({ 
  position, 
  theme, 
  beatIntensity = 0 
}: { 
  position: [number, number, number]; 
  theme: Theme;
  beatIntensity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // ランダムな動きのパラメータ
  const params = useMemo(() => ({
    speed: 0.5 + Math.random() * 1.0,
    amplitude: 2 + Math.random() * 3,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    phaseZ: Math.random() * Math.PI * 2,
    scaleBase: 0.3 + Math.random() * 0.7,
  }), []);

  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      const time = state.clock.elapsedTime;
      
      // 有機的な動き
      const offsetX = Math.sin(time * params.speed + params.phaseX) * params.amplitude;
      const offsetY = Math.cos(time * params.speed * 0.7 + params.phaseY) * params.amplitude * 0.5;
      const offsetZ = Math.sin(time * params.speed * 0.3 + params.phaseZ) * params.amplitude * 0.3;
      
      meshRef.current.position.set(
        position[0] + offsetX,
        position[1] + offsetY,
        position[2] + offsetZ
      );
      
      // ビートに合わせたスケール変化
      const beatScale = 1 + (beatIntensity / 100) * 0.5;
      const timeScale = 1 + Math.sin(time * 2) * 0.2;
      meshRef.current.scale.setScalar(params.scaleBase * beatScale * timeScale);
      
      // 回転
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
      
      // 透明度の変化
      const opacity = 0.3 + Math.sin(time * 1.5 + params.phaseX) * 0.2;
      materialRef.current.opacity = opacity;
      
      // 色の変化（テーマに基づく）
      const hue = (time * 0.1 + params.phaseX) % 1;
      if (theme.textColor === '#ffffff') {
        materialRef.current.color.setHSL(hue, 0.7, 0.8);
      } else {
        materialRef.current.color.setHSL(hue, 0.5, 0.3);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        transparent
        opacity={0.5}
        color={theme.textColor}
      />
    </mesh>
  );
}

// データフロー可視化コンポーネント
function DataFlow({ theme, beatIntensity = 0 }: { theme: Theme; beatIntensity?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // データフローのポイント
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      pts.push([
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40,
      ]);
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      // グループ全体の回転
      groupRef.current.rotation.y = time * 0.1;
      
      // ビートに合わせたスケール
      const beatScale = 1 + (beatIntensity / 100) * 0.3;
      groupRef.current.scale.setScalar(beatScale);
    }
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => (
        <BlobTracker
          key={index}
          position={point as [number, number, number]}
          theme={theme}
          beatIntensity={beatIntensity}
        />
      ))}
      
      {/* 接続線 */}
      {points.map((point, index) => {
        if (index === points.length - 1) return null;
        const nextPoint = points[index + 1];
        
        return (
          <line key={`line-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...point, ...nextPoint])}
                itemSize={3}
                args={[new Float32Array([...point, ...nextPoint]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={theme.textColor}
              transparent
              opacity={0.2}
            />
          </line>
        );
      })}
    </group>
  );
}

// パーティクルシステム
function ParticleSystem({ theme, beatIntensity = 0 }: { theme: Theme; beatIntensity?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 初期位置（球状分布）
      const radius = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.cos(phi);
      pos[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // 初期速度
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // 重力的な引力
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        
        const distance = Math.sqrt(x * x + y * y + z * z);
        const force = 0.001 / (distance + 1);
        
        velocities[i3] -= x * force;
        velocities[i3 + 1] -= y * force;
        velocities[i3 + 2] -= z * force;
        
        // ビートの影響
        const beatForce = beatIntensity / 10000;
        velocities[i3] += (Math.random() - 0.5) * beatForce;
        velocities[i3 + 1] += (Math.random() - 0.5) * beatForce;
        velocities[i3 + 2] += (Math.random() - 0.5) * beatForce;
        
        // 位置更新
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        
        // 境界チェック
        if (distance > 60) {
          positions[i3] *= 0.9;
          positions[i3 + 1] *= 0.9;
          positions[i3 + 2] *= 0.9;
        }
        
        // 速度減衰
        velocities[i3] *= 0.99;
        velocities[i3 + 1] *= 0.99;
        velocities[i3 + 2] *= 0.99;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={theme.textColor}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// ワイヤーフレーム球体
function WireframeSphere({ theme, beatIntensity = 0 }: { theme: Theme; beatIntensity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      // 回転
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
      
      // ビートに合わせたスケール
      const beatScale = 1 + (beatIntensity / 100) * 0.4;
      const timeScale = 1 + Math.sin(time * 2) * 0.1;
      meshRef.current.scale.setScalar(beatScale * timeScale);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[15, 32, 32]} />
      <meshBasicMaterial
        color={theme.textColor}
        wireframe
        transparent
        opacity={0.1}
      />
    </mesh>
  );
}

// メインのデータ可視化コンポーネント
export default function DataVisualization({ 
  theme, 
  beatIntensity = 0 
}: { 
  theme: Theme; 
  beatIntensity?: number;
}) {
  return (
    <group>
      {/* パーティクルシステム */}
      <ParticleSystem theme={theme} beatIntensity={beatIntensity} />
      
      {/* データフロー */}
      <DataFlow theme={theme} beatIntensity={beatIntensity} />
      
      {/* ワイヤーフレーム球体 */}
      <WireframeSphere theme={theme} beatIntensity={beatIntensity} />
    </group>
  );
}
