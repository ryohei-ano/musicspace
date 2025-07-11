'use client';

import { useState, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { splitLyricsIntoSegments, splitLyricsSimple } from '@/lib/textAnalyzer';

interface LyricsData {
  id: number;
  title: string;
  artist: string;
  lyrics: string[];
  url: string;
}

interface MusicLyricsProps {
  lyrics: LyricsData | null;
  beatIntensity: number;
  onCameraTarget?: (position: Vector3) => void;
}

// 歌詞を自然な文節に分割する関数（kuromoji.js使用）
async function splitIntoSegments(lyrics: string[]): Promise<string[]> {
  try {
    // kuromoji.jsを使用した高精度な分割を試行
    const segments = await splitLyricsIntoSegments(lyrics);
    console.log('kuromoji.js分割結果:', segments.length, '個のセグメント');
    return segments;
  } catch (error) {
    console.warn('kuromoji.js分割に失敗、フォールバックを使用:', error);
    // フォールバック：簡易版の分割
    return splitLyricsSimple(lyrics);
  }
}

export default function MusicLyrics({ lyrics, beatIntensity, onCameraTarget }: MusicLyricsProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [segments, setSegments] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBeatRef = useRef<number>(0);

  // 歌詞が変更されたときにセグメントを生成
  useEffect(() => {
    if (lyrics) {
      const generateSegments = async () => {
        try {
          const newSegments = await splitIntoSegments(lyrics.lyrics);
          setSegments(newSegments);
          setCurrentSegmentIndex(0);
          setIsPlaying(false);
        } catch (error) {
          console.error('歌詞分割エラー:', error);
          // フォールバック：簡易版を使用
          const fallbackSegments = splitLyricsSimple(lyrics.lyrics);
          setSegments(fallbackSegments);
          setCurrentSegmentIndex(0);
          setIsPlaying(false);
        }
      };
      
      generateSegments();
    }
  }, [lyrics]);

  // ビートに合わせて歌詞を進める
  useEffect(() => {
    if (!lyrics || !isPlaying || segments.length === 0) return;

    const now = Date.now();
    
    // ビート強度が閾値を超えた場合、歌詞を進める
    if (beatIntensity > 25 && now - lastBeatRef.current > 1500) {
      lastBeatRef.current = now;
      setCurrentSegmentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= segments.length) {
          setIsPlaying(false);
          return 0;
        }
        return nextIndex;
      });
    }
  }, [beatIntensity, lyrics, isPlaying, segments]);

  // 自動進行（フォールバック）
  useEffect(() => {
    if (!lyrics || !isPlaying || segments.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCurrentSegmentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= segments.length) {
          setIsPlaying(false);
          return 0;
        }
        return nextIndex;
      });
    }, 2500); // 2.5秒ごと（文節なので少し早く）

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lyrics, isPlaying, segments]);

  // カメラターゲットの更新
  useEffect(() => {
    if (lyrics && currentSegmentIndex < segments.length) {
      // 現在の歌詞位置にカメラを向ける（より滑らかな動き）
      const position = new Vector3(
        Math.sin(currentSegmentIndex * 0.3) * 8,
        currentSegmentIndex * 1.5,
        Math.cos(currentSegmentIndex * 0.3) * 8
      );
      onCameraTarget?.(position);
    }
  }, [currentSegmentIndex, lyrics, segments, onCameraTarget]);

  if (!lyrics) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-black/80 text-white px-4 py-2 rounded">
          歌詞を検索してください
        </div>
      </div>
    );
  }

  const currentSegment = segments[currentSegmentIndex] || '';
  const progress = segments.length > 0 ? ((currentSegmentIndex + 1) / segments.length) * 100 : 0;

  return (
    <>
      {/* UI制御パネル */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-black/90 text-white p-4 rounded-lg min-w-80">
          <div className="text-center mb-2">
            <div className="font-bold">{lyrics.title}</div>
            <div className="text-sm text-gray-300">{lyrics.artist}</div>
          </div>
          
          <div className="text-center mb-3">
            <div className="text-lg min-h-[1.75rem] flex items-center justify-center">
              {currentSegment}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              {isPlaying ? '⏸ 停止' : '▶ 再生'}
            </button>
            
            <button
              onClick={() => setCurrentSegmentIndex(0)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              ⏮ 最初から
            </button>
            
            <div className="flex-1 text-xs text-gray-300">
              {currentSegmentIndex + 1} / {segments.length}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {beatIntensity > 0 && (
            <div className="mt-2 text-xs text-center">
              ビート強度: {Math.round(beatIntensity)}
            </div>
          )}
          
          {segments.length > 0 && (
            <div className="mt-1 text-xs text-center text-gray-400">
              文節数: {segments.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
