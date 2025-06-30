'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VideoPlaneProps {
  videoSrc: string;
  position: [number, number, number];
  delay: number;
  scale?: number;
}

export default function VideoPlane({ videoSrc, position, delay, scale = 1 }: VideoPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 遅延後に表示開始
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    // 動画要素を作成
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true; // 自動再生のためミュート必須
    video.playsInline = true;
    video.autoplay = true;
    
    // 動画が読み込まれたらテクスチャを作成
    video.addEventListener('loadeddata', () => {
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      setVideoTexture(texture);
      
      // 動画再生開始
      video.play().catch(console.error);
    });

    videoRef.current = video;

    return () => {
      if (videoTexture) {
        videoTexture.dispose();
      }
      video.pause();
      video.src = '';
    };
  }, [videoSrc, isVisible]);

  // アニメーション（フェードイン効果）
  useFrame((state) => {
    if (meshRef.current && isVisible) {
      const elapsed = state.clock.getElapsedTime() * 1000 - delay;
      if (elapsed > 0) {
        const opacity = Math.min(elapsed / 1000, 1); // 1秒でフェードイン
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
          meshRef.current.material.opacity = opacity;
        }
      }
    }
  });

  if (!isVisible || !videoTexture) {
    return null;
  }

  // 動画のアスペクト比を維持（16:9を想定）
  const width = 4 * scale;
  const height = 2.25 * scale; // 16:9比率

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={videoTexture}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
