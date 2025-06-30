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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 動画要素を事前に作成して読み込み開始
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata'; // メタデータのみ事前読み込み
    
    // パフォーマンス最適化の設定
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    
    // 動画が読み込まれたらテクスチャを作成
    const handleLoadedData = () => {
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat; // 元の色を保持するためRGBAFormat
      setVideoTexture(texture);
      setIsLoaded(true);
    };

    const handleCanPlay = () => {
      // 動画再生準備完了
      video.play().catch(console.error);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);

    videoRef.current = video;

    // 遅延後に表示開始
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      if (videoTexture) {
        videoTexture.dispose();
      }
      video.pause();
      video.src = '';
    };
  }, [videoSrc, delay]);

  // アニメーション（フェードイン効果）
  useFrame((state) => {
    if (meshRef.current && isVisible && isLoaded) {
      const elapsed = state.clock.getElapsedTime() * 1000 - delay;
      if (elapsed > 0) {
        const opacity = Math.min(elapsed / 500, 1); // 0.5秒でフェードイン（高速化）
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
          meshRef.current.material.opacity = opacity;
          // 動画をより鮮明に表示するための設定
          meshRef.current.material.transparent = opacity < 1;
        }
      }
    }
  });

  if (!isVisible || !videoTexture || !isLoaded) {
    return null;
  }

  // 動画のアスペクト比を維持（16:9を想定）
  const width = 3 * scale; // サイズを少し小さくしてパフォーマンス向上
  const height = 1.69 * scale; // 16:9比率

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={videoTexture}
        transparent
        opacity={0}
        side={THREE.FrontSide} // 正面のみ描画
      />
    </mesh>
  );
}
