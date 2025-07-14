import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

const GENIUS_API_BASE = 'https://api.genius.com';
const ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

console.log('Genius API Token check:', ACCESS_TOKEN ? 'Token found' : 'Token missing');

interface LyricsResult {
  id: number;
  title: string;
  artist: string;
  lyrics: string[];
  url: string;
  debug?: {
    searchQuery: string;
    foundResults?: number;
    selectedIndex?: number;
    lyricsCount?: number;
    source?: string;
    timestamp: string;
    searchError?: string;
    fallback?: boolean;
  };
}

// シンプルなメモリキャッシュ
interface CacheEntry {
  data: LyricsResult;
  timestamp: number;
}

const lyricsCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// シンプルな歌詞抽出関数
async function extractLyricsFromGeniusPage(url: string): Promise<string[]> {
  try {
    console.log('Extracting lyrics from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch page: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // 2025年版のGeniusセレクター
    const selectors = [
      '[data-lyrics-container="true"]',
      '.Lyrics__Container-sc-1ynbvzw-1',
      '.Lyrics__Container-sc-1ynbvzw-6',
      '.RichText__Container-oz284w-0',
      '[class*="Lyrics__Container"]',
      '[class*="RichText__Container"]',
      '.lyrics'
    ];
    
    const lyrics: string[] = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found lyrics with selector: ${selector}`);
        elements.each((_, element) => {
          const text = $(element).text();
          if (text && text.trim()) {
            const lines = text.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
            lyrics.push(...lines);
          }
        });
        
        if (lyrics.length > 0) {
          break;
        }
      }
    }
    
    // 基本的なクリーニング
    const cleanedLyrics = lyrics
      .filter(line => {
        const trimmed = line.trim();
        if (trimmed.length < 1 || trimmed.length > 500) return false;
        
        // 明らかなメタデータを除外
        const excludePatterns = [
          /^\d+\s*contributors?/i,
          /^you might also like/i,
          /^more on genius/i,
          /^embed$/i,
          /^genius$/i,
        ];
        
        return !excludePatterns.some(pattern => pattern.test(trimmed));
      })
      .slice(0, 50); // 最大50行
    
    console.log(`Extracted ${cleanedLyrics.length} lines of lyrics`);
    return cleanedLyrics;
    
  } catch (error) {
    console.error('Lyrics extraction error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('=== Lyrics API Request ===');
  console.log('Query:', query);
  console.log('Genius Token Available:', !!ACCESS_TOKEN);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // キャッシュをチェック
  const cacheKey = query.toLowerCase().trim();
  const cached = lyricsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached lyrics for:', query);
    return NextResponse.json(cached.data);
  }

  try {
    // Genius APIで楽曲を検索
    if (!ACCESS_TOKEN) {
      throw new Error('Genius API token not available');
    }

    console.log('Searching with Genius API...');
    const searchUrl = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(query)}`;
    console.log('Search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (compatible; LyricsBot/1.0)',
      },
    });

    console.log('Search response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Search API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search results count:', searchData.response?.hits?.length || 0);
    
    if (!searchData.response?.hits?.length) {
      throw new Error('No search results found');
    }

    const searchResults = searchData.response.hits;
    
    // 英語翻訳版を除外し、原文を優先
    const filteredResults = searchResults.filter((hit: { result: { title: string; primary_artist: { name: string } } }) => {
      const song = hit.result;
      const title = song.title.toLowerCase();
      const artist = song.primary_artist.name.toLowerCase();
      
      // 英語翻訳版を除外
      const isTranslation = title.includes('english translation') || 
                          artist.includes('english translation') ||
                          artist.includes('genius english translations');
      
      return !isTranslation;
    });
    
    // フィルタリング後の結果を使用、なければ元の結果を使用
    const resultsToUse = filteredResults.length > 0 ? filteredResults : searchResults;
    console.log(`Original results: ${searchResults.length}, Filtered results: ${filteredResults.length}`);
    
    // 最も関連性の高い楽曲を複数試行
    for (let i = 0; i < Math.min(3, resultsToUse.length); i++) {
      const song = resultsToUse[i].result;
      console.log(`Trying song ${i + 1}:`, song.title, 'by', song.primary_artist.name);
      
      // 歌詞を抽出
      const lyrics = await extractLyricsFromGeniusPage(song.url);
      
      console.log(`Extracted lyrics count: ${lyrics.length}`);
      
      if (lyrics.length > 0) {
        const result = {
          id: song.id,
          title: song.title,
          artist: song.primary_artist.name,
          lyrics: lyrics,
          url: song.url,
          debug: {
            searchQuery: query,
            foundResults: searchResults.length,
            selectedIndex: i,
            lyricsCount: lyrics.length,
            source: 'Genius API + scraping',
            timestamp: new Date().toISOString()
          }
        };

        // キャッシュに保存
        lyricsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        console.log('Successfully found lyrics for:', song.title);
        return NextResponse.json(result);
      }
    }
    
    throw new Error('No lyrics found for any search results');
    
  } catch (error) {
    console.error('Lyrics API error:', error);
    
    // フォールバック応答
    console.log('Using fallback response...');
    
    // クエリを解析してタイトルとアーティストを推測
    const queryParts = query.trim().split(/\s+/);
    let title = 'Unknown Song';
    let artist = 'Unknown Artist';
    
    if (queryParts.length >= 2) {
      // 最後の単語をアーティスト、残りをタイトルとして推測
      artist = queryParts[queryParts.length - 1];
      title = queryParts.slice(0, -1).join(' ');
    } else if (queryParts.length === 1) {
      title = queryParts[0];
    }
    
    const fallbackLyrics = [
      `🎵 ${title}`,
      `🎤 ${artist}`,
      '',
      '歌詞の取得に失敗しました',
      '',
      '考えられる原因:',
      '• 楽曲名やアーティスト名が正確でない',
      '• Geniusに歌詞が登録されていない',
      '• ネットワーク接続の問題',
      '• サイトの構造変更',
      '',
      '対処法:',
      '• 楽曲名とアーティスト名を正確に入力',
      '• 英語表記で試してみる',
      '• 別の楽曲で試してみる',
      '',
      `検索クエリ: "${query}"`,
      `エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    ];
    
    const fallbackResult = {
      id: Date.now(),
      title: title,
      artist: artist,
      lyrics: fallbackLyrics,
      url: `https://genius.com/search?q=${encodeURIComponent(query)}`,
      debug: {
        searchQuery: query,
        searchError: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        timestamp: new Date().toISOString()
      }
    };

    // フォールバック結果もキャッシュ（短時間）
    lyricsCache.set(cacheKey, {
      data: fallbackResult,
      timestamp: Date.now()
    });

    console.log('Returning fallback result');
    return NextResponse.json(fallbackResult);
  }
}
