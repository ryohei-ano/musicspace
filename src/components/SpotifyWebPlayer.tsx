'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface SpotifyWebPlayerProps {
  trackId?: string;
  onPlayerReady?: () => void;
  onPlaybackState?: (isPlaying: boolean) => void;
  onLyricsStart?: () => void;
}

export default function SpotifyWebPlayer({ 
  trackId, 
  onPlayerReady, 
  onPlaybackState,
  onLyricsStart
}: SpotifyWebPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playbackCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // 再生状態を監視する関数
  const checkPlaybackState = useCallback(() => {
    if (!iframeRef.current) return;

    try {
      // iframe内のSpotifyプレーヤーの状態を監視
      // 実際の再生状態は直接取得できないため、ユーザーの操作を検出
      const iframe = iframeRef.current;
      
      // iframe要素にイベントリスナーを追加
      iframe.addEventListener('load', () => {
        // iframe内のクリックを検出するためのオーバーレイ
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '1';
        overlay.style.pointerEvents = 'none';
        
        // iframe要素の親にオーバーレイを追加
        if (iframe.parentElement) {
          iframe.parentElement.style.position = 'relative';
          iframe.parentElement.appendChild(overlay);
        }
      });

    } catch (error) {
      console.warn('再生状態の監視でエラーが発生:', error);
    }
  }, []);

  // trackIdが変更されたときの処理
  useEffect(() => {
    if (trackId) {
      setIsPlaying(false);
      
      // 少し遅延してから再生状態の監視を開始
      setTimeout(() => {
        onPlayerReady?.();
        checkPlaybackState();
      }, 1000);
    }

    const currentInterval = playbackCheckInterval.current;
    return () => {
      if (currentInterval) {
        clearInterval(currentInterval);
      }
    };
  }, [trackId, onPlayerReady, checkPlaybackState]);

  // iframe要素のクリックを監視
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !trackId) return;

    const handleClick = () => {
      // クリック後少し遅延して再生状態を更新
      setTimeout(() => {
        if (!isPlaying) {
          console.log('Spotifyプレーヤーのクリックを検出 - 再生開始');
          setIsPlaying(true);
          onPlaybackState?.(true);
          onLyricsStart?.();
        }
      }, 500);
    };

    // iframe要素の親要素にクリックリスナーを追加
    const parent = iframe.parentElement;
    if (parent) {
      parent.addEventListener('click', handleClick);
      
      return () => {
        parent.removeEventListener('click', handleClick);
      };
    }
  }, [trackId, isPlaying, onPlaybackState, onLyricsStart]);

  if (!trackId) {
    return null;
  }

  return (
    <div className="relative">
      <iframe 
        ref={iframeRef}
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
        width="352"
        height="152"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
        onLoad={() => {
          onPlayerReady?.();
        }}
      />
      
      {/* 再生状態インジケーター */}
      {isPlaying && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          再生中
        </div>
      )}
      
    </div>
  );
}
