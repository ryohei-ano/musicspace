'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Win2000Panel from './ui/Win2000Panel';
import Win2000Button from './ui/Win2000Button';
import { SpotifyTrack } from '@/types/music';

interface MusicPanelProps {
  onTrackSelected?: (track: SpotifyTrack) => void;
}

export default function MusicPanel({ onTrackSelected }: MusicPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }
      const data = await response.json();
      setSpotifyTracks(data.tracks);
    } catch (error) {
      console.error('Search error:', error);
      alert('楽曲の検索に失敗しました。');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // デバウンス付き自動検索
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      // 既存のタイマーをクリア
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // 500ms後に検索実行
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      // 検索クエリが短い場合は結果をクリア
      setSpotifyTracks([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  const handleTrackSelect = useCallback((track: SpotifyTrack) => {
    console.log('Track selected:', track);
    onTrackSelected?.(track);
  }, [onTrackSelected]);

  if (!isVisible) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Win2000Button
          onClick={() => setIsVisible(true)}
          size="sm"
        >
          🎵 Music
        </Win2000Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-80">
      <Win2000Panel variant="raised" padding="sm">
        {/* タイトルバー */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#808080]">
          <span className="text-sm font-bold text-black">Music Search</span>
          <Win2000Button
            size="sm"
            onClick={() => setIsVisible(false)}
            className="px-2 py-0 text-xs"
          >
            ×
          </Win2000Button>
        </div>

        {/* 検索セクション */}
        <div className="mb-4">
          <label className="block text-xs text-black mb-1">曲名・アーティスト名:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-2 py-1 text-sm border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-white text-black font-mono focus:outline-none"
              placeholder="Search your music..."
            />
            <Win2000Button
              size="sm"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? '検索中...' : '検索'}
            </Win2000Button>
          </div>
        </div>

        {/* Spotify楽曲リスト */}
        {spotifyTracks.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs text-black mb-1">曲を選択:</label>
            <Win2000Panel variant="sunken" padding="sm">
              <div className="max-h-60 overflow-y-auto space-y-1">
                {spotifyTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-2 p-2 hover:bg-blue-100 cursor-pointer text-xs border-b border-gray-200 last:border-b-0"
                    onClick={() => handleTrackSelect(track)}
                  >
                    {track.image ? (
                      <Image 
                        src={track.image} 
                        alt={track.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          console.error('Image load error for track:', track.name, track.image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs">
                        🎵
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black truncate">{track.name}</div>
                      <div className="text-gray-600 truncate">{track.artist}</div>
                    </div>
                    {track.preview_url && (
                      <span className="text-green-600 text-sm">🎵</span>
                    )}
                  </div>
                ))}
              </div>
            </Win2000Panel>
          </div>
        )}
      </Win2000Panel>
    </div>
  );
}
