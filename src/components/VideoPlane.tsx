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
    
    // モバイル対応の設定
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'false'); // 自動再生を無効化
    
    // エラーハンドリング
    const handleError = (error: Event) => {
      console.error('Video loading error:', error);
    };

    // 動画が読み込まれたらテクスチャを作成
    const handleLoadedData = () => {
      try {
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        texture.flipY = false; // モバイル対応
        setVideoTexture(texture);
        setIsLoaded(true);
      } catch (error) {
        console.error('Video texture creation failed:', error);
      }
    };

    const handleCanPlay = () => {
      // モバイルブラウザ対応：ユーザーインタラクション後に再生
      const tryPlay = async () => {
        try {
          // モバイルでの再生を強制的に試行
          video.currentTime = 0;
          await video.play();
        } catch (error) {
          console.warn('Video autoplay failed:', error);
          // 自動再生に失敗した場合は静止画として表示
        }
      };

      // 即座に再生を試行
      tryPlay();

      // ユーザーインタラクション後に再生を再試行
      const handleUserInteraction = () => {
        tryPlay();
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      };

      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('click', handleUserInteraction, { once: true });
    };

    // より多くのイベントリスナーを追加
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', () => console.log('Video load started:', videoSrc));

    videoRef.current = video;

    // 遅延後に表示開始
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.pause();
      video.src = '';
      video.load(); // リソースを完全にクリア
    };
  }, [videoSrc, delay]);

  // videoTextureのクリーンアップを別のuseEffectで管理
  useEffect(() => {
    return () => {
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [videoTexture]);

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
