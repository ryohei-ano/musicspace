// 音楽関連の型定義

export interface Track {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  preview_url?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  external_urls: string;
  image: string | undefined;
  duration_ms: number;
}

export interface LyricLine {
  text: string;
  startTime: number; // ミリ秒
  endTime: number;   // ミリ秒
  position: [number, number, number]; // 3D座標
}

export interface AudioAnalysisData {
  tempo: number;
  beats: number[];
  energy: number;
  loudness: number;
  frequencyData: Uint8Array;
}

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number; // ミリ秒
  volume: number;   // 0-1
  isConnected: boolean;
}

export interface LyricsData {
  trackId: string;
  lines: LyricLine[];
  syncedWithAudio: boolean;
}

export interface GeniusSearchResult {
  id: number;
  title: string;
  artist_names: string;
  url: string;
  lyrics_url?: string;
}

export interface GeniusLyrics {
  lyrics: string;
  title: string;
  artist: string;
}
