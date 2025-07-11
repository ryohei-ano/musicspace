import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

const GENIUS_API_BASE = 'https://api.genius.com';
const ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

console.log('Genius API Token check:', ACCESS_TOKEN ? 'Token found' : 'Token missing');

// 簡単なメモリキャッシュ
interface CacheEntry {
  data: LyricsResult;
  timestamp: number;
}

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

const lyricsCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// lyricsgenius風のGenius API使用（Node.js版）
async function searchSongWithGenius(artist: string, title: string): Promise<string[]> {
  try {
    console.log('Searching song with Genius API:', artist, '-', title);
    
    // まずアーティストを検索
    const artistSearchUrl = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(artist)}`;
    const artistResponse = await fetch(artistSearchUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (compatible; LyricsBot/1.0)',
      }
    });
    
    if (!artistResponse.ok) {
      throw new Error(`Artist search failed: ${artistResponse.status}`);
    }
    
    const artistData = await artistResponse.json();
    
    // アーティストIDを取得
    if (artistData.response?.hits?.length > 0) {
      for (const hit of artistData.response.hits) {
        const foundArtist = hit.result.primary_artist;
        if (foundArtist.name.toLowerCase().includes(artist.toLowerCase()) || 
            artist.toLowerCase().includes(foundArtist.name.toLowerCase())) {
          console.log('Found artist:', foundArtist.name, 'ID:', foundArtist.id);
          break;
        }
      }
    }
    
    // 楽曲を検索
    const songQuery = `${title} ${artist}`;
    
    const songSearchUrl = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(songQuery)}`;
    const songResponse = await fetch(songSearchUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (compatible; LyricsBot/1.0)',
      }
    });
    
    if (!songResponse.ok) {
      throw new Error(`Song search failed: ${songResponse.status}`);
    }
    
    const songData = await songResponse.json();
    
    if (songData.response?.hits?.length > 0) {
      // 最も関連性の高い楽曲を探す
      for (const hit of songData.response.hits) {
        const song = hit.result;
        const songTitle = song.title.toLowerCase();
        const songArtist = song.primary_artist.name.toLowerCase();
        
        // タイトルとアーティストの一致度をチェック
        const titleMatch = songTitle.includes(title.toLowerCase()) || 
                          title.toLowerCase().includes(songTitle);
        const artistMatch = songArtist.includes(artist.toLowerCase()) || 
                           artist.toLowerCase().includes(songArtist);
        
        if (titleMatch && artistMatch) {
          console.log('Found matching song:', song.title, 'by', song.primary_artist.name);
          
          // 歌詞を取得
          const lyrics = await extractLyricsFromGeniusPage(song.url);
          if (lyrics.length > 0) {
            return lyrics;
          }
        }
      }
      
      // 完全一致しない場合、最初の結果を試す
      const firstSong = songData.response.hits[0].result;
      console.log('Trying first result:', firstSong.title, 'by', firstSong.primary_artist.name);
      return await extractLyricsFromGeniusPage(firstSong.url);
    }
    
    throw new Error('No songs found');
  } catch (error) {
    console.error('Genius song search error:', error);
    return [];
  }
}

// 改良されたGenius歌詞抽出
async function extractLyricsFromGeniusPage(url: string): Promise<string[]> {
  try {
    console.log('Extracting lyrics from Genius page:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://genius.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    const lyrics: string[] = [];
    
    // 複数の方法で歌詞を抽出
    
    // 方法1: 最新のセレクター
    const modernSelectors = [
      '[data-lyrics-container="true"]',
      '.Lyrics__Container-sc-1ynbvzw-1',
      '.Lyrics__Container-sc-1ynbvzw-6', 
      '.RichText__Container-oz284w-0',
      '[class*="Lyrics__Container"]',
      '[class*="RichText__Container"]',
      '.lyrics'
    ];
    
    for (const selector of modernSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found lyrics with selector: ${selector}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        elements.each((_: number, element: any) => {
          const text = $(element).text();
          if (text && text.trim()) {
            const lines = text.split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0);
            lyrics.push(...lines);
          }
        });
        
        if (lyrics.length > 5) {
          break;
        }
      }
    }
    
    // 方法2: JSONデータから抽出
    if (lyrics.length === 0) {
      console.log('Trying JSON extraction...');
      const jsonPatterns = [
        /window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\('([^']+)'\)/,
        /"lyrics":\s*"([^"]+)"/,
        /"body":\s*{\s*"html":\s*"([^"]+)"/
      ];
      
      for (const pattern of jsonPatterns) {
        const match = html.match(pattern);
        if (match) {
          try {
            let jsonStr = match[1];
            if (pattern === jsonPatterns[0]) {
              jsonStr = jsonStr.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              const data = JSON.parse(jsonStr);
              
              // 歌詞データを探す
              const findLyrics = (obj: unknown): string | null => {
                if (typeof obj === 'string' && obj.length > 100 && obj.includes('\n')) {
                  return obj;
                }
                if (typeof obj === 'object' && obj !== null) {
                  for (const key in obj as Record<string, unknown>) {
                    if (key.includes('lyrics') || key.includes('body')) {
                      const result = findLyrics((obj as Record<string, unknown>)[key]);
                      if (result) return result;
                    }
                  }
                  for (const value of Object.values(obj as Record<string, unknown>)) {
                    const result = findLyrics(value);
                    if (result) return result;
                  }
                }
                return null;
              };
              
              const lyricsText = findLyrics(data);
              if (lyricsText) {
                const cleanText = lyricsText.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n');
                const lines = cleanText.split('\n')
                  .map((line: string) => line.trim())
                  .filter((line: string) => line.length > 0);
                lyrics.push(...lines);
                console.log(`Found lyrics from JSON: ${lines.length} lines`);
                break;
              }
            } else {
              const cleanText = jsonStr.replace(/\\n/g, '\n').replace(/\\"/g, '"');
              const lines = cleanText.split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.length > 0);
              if (lines.length > 5) {
                lyrics.push(...lines);
                console.log(`Found lyrics from pattern: ${lines.length} lines`);
                break;
              }
            }
          } catch {
            console.log('JSON parse failed, continuing...');
          }
        }
      }
    }
    
    // 歌詞の基本的なクリーニング（ほぼ全てを保持）
    const cleanedLyrics = lyrics.filter((line: string) => {
      const trimmed = line.trim();
      
      // 最小限のチェックのみ（空行と異常に長い行のみ除外）
      if (trimmed.length < 1 || trimmed.length > 2000) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Cleaned lyrics: ${cleanedLyrics.length} lines`);
    
    // 重複を除去
    const uniqueLyrics = [...new Set(cleanedLyrics)];
    
    return uniqueLyrics.slice(0, 100); // 最大100行
  } catch (error) {
    console.error('Genius page extraction error:', error);
    return [];
  }
}

// 改良されたスクレイピング関数
async function scrapeLyricsFromURL(url: string): Promise<string[]> {
  try {
    console.log('Scraping lyrics from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lyrics page: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    const lyrics: string[] = [];
    
    // 最新のGeniusセレクター（2025年版）
    const selectors = [
      '[data-lyrics-container="true"]',
      '.Lyrics__Container-sc-1ynbvzw-1',
      '.Lyrics__Container-sc-1ynbvzw-6',
      '.RichText__Container-oz284w-0',
      '[class*="Lyrics__Container"]',
      '[class*="RichText__Container"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Trying selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        elements.each((_: number, element: any) => {
          const text = $(element).text();
          if (text && text.trim()) {
            const lines = text.split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0);
            lyrics.push(...lines);
          }
        });
        
        if (lyrics.length > 0) {
          console.log(`Found lyrics with selector "${selector}": ${lyrics.length} lines`);
          break;
        }
      }
    }
    
    // 歌詞のクリーニング（ほぼ全てを保持）
    const cleanedLyrics = lyrics.filter((line: string) => {
      const trimmed = line.trim();
      
      // 最小限のチェックのみ（空行と異常に長い行のみ除外）
      if (trimmed.length < 1 || trimmed.length > 2000) {
        return false;
      }
      
      // 最小限の除外パターン（明らかなメタデータのみ）
      const excludePatterns = [
        /^\d+\s*contributors?/i,
        /^you might also like/i,
        /^more on genius/i,
        /^embed$/i,
        /^genius$/i,
      ];
      
      // 明らかなメタデータのみを除外
      for (const pattern of excludePatterns) {
        if (pattern.test(trimmed)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`Cleaned lyrics: ${cleanedLyrics.length} lines`);
    
    // 重複を除去
    const uniqueLyrics = [...new Set(cleanedLyrics)];
    
    return uniqueLyrics.slice(0, 50);
  } catch (error) {
    console.error('Scraping error:', error);
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

  let searchResults: Array<{ result: { id: number; title: string; primary_artist: { name: string }; url: string } }> = [];
  let searchError: string | null = null;

  try {
    // Genius APIで楽曲を検索（タイムアウト付き）
    if (ACCESS_TOKEN) {
      console.log('Searching with Genius API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      try {
        const searchUrl = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(query)}`;
        console.log('Search URL:', searchUrl);
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'User-Agent': 'Mozilla/5.0 (compatible; LyricsBot/1.0)',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Search response status:', searchResponse.status);

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log('Search results count:', searchData.response?.hits?.length || 0);
          
          if (searchData.response?.hits?.length > 0) {
            searchResults = searchData.response.hits;
            
            // 英語翻訳版を除外し、原文を優先
            const filteredResults = searchResults.filter(hit => {
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
              
              // Genius Enhanced検索を試行
              try {
                const geniusResult = await searchSongWithGenius(song.primary_artist.name, song.title);
                if (geniusResult.length > 0) { // 1行以上あれば成功とする
                  const result = {
                    id: song.id,
                    title: song.title,
                    artist: song.primary_artist.name,
                    lyrics: geniusResult,
                    url: song.url,
                    debug: {
                      searchQuery: query,
                      foundResults: searchResults.length,
                      selectedIndex: i,
                      lyricsCount: geniusResult.length,
                      source: 'Genius Enhanced',
                      timestamp: new Date().toISOString()
                    }
                  };

                  // キャッシュに保存
                  lyricsCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                  });

                  console.log('Successfully found lyrics from Genius Enhanced for:', song.title);
                  return NextResponse.json(result);
                }
              } catch {
                console.log('Genius Enhanced failed, trying direct scraping...');
              }
              
              // 直接Geniusスクレイピングを試行
              const lyricsController = new AbortController();
              const lyricsTimeoutId = setTimeout(() => lyricsController.abort(), 15000); // 15秒タイムアウト
              
              try {
                const lyrics = await scrapeLyricsFromURL(song.url);
                clearTimeout(lyricsTimeoutId);
                
                console.log(`Scraped lyrics count: ${lyrics.length}`);
                
                if (lyrics.length > 0) { // 1行以上あれば成功とする
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
                      source: 'Genius scraping',
                      timestamp: new Date().toISOString()
                    }
                  };

                  // キャッシュに保存
                  lyricsCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                  });

                  console.log('Successfully found lyrics from Genius scraping for:', song.title);
                  return NextResponse.json(result);
                }
              } catch (lyricsError) {
                clearTimeout(lyricsTimeoutId);
                console.error(`Lyrics scraping failed for song ${i + 1}:`, lyricsError);
                continue; // 次の楽曲を試行
              }
            }
          } else {
            searchError = 'No search results found';
          }
        } else {
          const errorText = await searchResponse.text();
          searchError = `Search API error: ${searchResponse.status} - ${errorText}`;
          console.error(searchError);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Search timeout or error:', fetchError);
        searchError = `Search request failed: ${fetchError}`;
      }
    } else {
      searchError = 'Genius API token not available';
      console.error(searchError);
    }
    
    // APIが利用できない場合やスクレイピングに失敗した場合のフォールバック
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
      searchError ? `エラー: ${searchError}` : '',
      searchResults.length > 0 ? `検索結果: ${searchResults.length}件見つかりました` : '検索結果: 0件'
    ].filter(line => line !== ''); // 空文字列を除去
    
    const fallbackResult = {
      id: Date.now(),
      title: title,
      artist: artist,
      lyrics: fallbackLyrics,
      url: `https://genius.com/search?q=${encodeURIComponent(query)}`,
      debug: {
        searchQuery: query,
        searchError: searchError || undefined,
        foundResults: searchResults.length,
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

  } catch (error) {
    console.error('Lyrics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch lyrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          searchQuery: query,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
