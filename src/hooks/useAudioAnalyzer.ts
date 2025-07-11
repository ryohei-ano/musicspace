'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioAnalysisData } from '@/types/music';

interface UseAudioAnalyzerOptions {
  onBeatDetected?: (intensity: number) => void;
  onFrequencyData?: (data: Uint8Array) => void;
}

export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ビート検出用の変数
  const lastBeatTimeRef = useRef<number>(0);
  const energyHistoryRef = useRef<number[]>([]);

  // ビート検出アルゴリズム
  const detectBeat = useCallback((frequencyData: Uint8Array): number => {
    // 低音域（20-200Hz）のエネルギーを計算
    const bassRange = frequencyData.slice(0, 32);
    const energy = bassRange.reduce((sum, value) => sum + value * value, 0) / bassRange.length;

    // エネルギー履歴を更新
    energyHistoryRef.current.push(energy);
    if (energyHistoryRef.current.length > 43) { // 約1秒分の履歴
      energyHistoryRef.current.shift();
    }

    // 平均エネルギーを計算
    const avgEnergy = energyHistoryRef.current.reduce((sum, e) => sum + e, 0) / energyHistoryRef.current.length;
    
    // ビート検出の閾値
    const threshold = avgEnergy * 1.3;
    const now = Date.now();

    if (energy > threshold && now - lastBeatTimeRef.current > 300) { // 最小300ms間隔
      lastBeatTimeRef.current = now;
      const intensity = Math.min((energy / avgEnergy - 1) * 100, 100);
      options.onBeatDetected?.(intensity);
      return intensity;
    }

    return 0;
  }, [options]);

  // 音声解析ループ
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current) return;

    const frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(frequencyData);

    // ビート検出
    const beatIntensity = detectBeat(frequencyData);
    
    // 音量レベル計算
    const volume = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    
    // データを更新
    setAudioData({
      tempo: 120, // 仮の値
      beats: [beatIntensity],
      energy: volume,
      loudness: volume,
      frequencyData: frequencyData.slice()
    });

    options.onFrequencyData?.(frequencyData);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [detectBeat, options]);

  // 音声解析開始
  const startAnalysis = useCallback(async () => {
    try {
      setError(null);
      
      // ブラウザタブの音声をキャプチャ
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      streamRef.current = stream;

      // Web Audio APIのセットアップ
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;

      source.connect(analyzer);

      setIsAnalyzing(true);
      analyzeAudio();

    } catch (err) {
      console.error('Audio analysis failed:', err);
      setError('音声キャプチャに失敗しました。ブラウザタブの音声共有を許可してください。');
    }
  }, [analyzeAudio]);

  // 音声解析停止
  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    sourceRef.current = null;
    analyzerRef.current = null;
    setIsAnalyzing(false);
    setAudioData(null);
    
    // 履歴をクリア
    energyHistoryRef.current = [];
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    isAnalyzing,
    error,
    audioData,
    startAnalysis,
    stopAnalysis
  };
}
