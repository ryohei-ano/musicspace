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

// 改良された歌詞抽出関数（デバッグ強化版）
async function extractLyricsFromGeniusPage(url: string): Promise<string[]> {
  try {
    console.log('🎵 Extracting lyrics from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch page: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`📄 HTML length: ${html.length} characters`);
    console.log(`📄 HTML preview (first 500 chars):`, html.substring(0, 500));
    
    const $ = load(html);
    
    // 2025年版の拡張されたGeniusセレクター
    const selectors = [
      // 最新のセレクター
      '[data-lyrics-container="true"]',
      '[data-testid="lyrics"]',
      '.Lyrics__Container-sc-1ynbvzw-1',
      '.Lyrics__Container-sc-1ynbvzw-6',
      '.RichText__Container-oz284w-0',
      '.SongPageLyrics-sc-1ynbvzw-1',
      '.LyricsBody-sc-1ynbvzw-1',
      
      // 汎用セレクター
      '[class*="Lyrics__Container"]',
      '[class*="RichText__Container"]',
      '[class*="SongPageLyrics"]',
      '[class*="LyricsBody"]',
      '[class*="lyrics"]',
      
      // フォールバック
      '.lyrics',
      '#lyrics',
      '.song_body-lyrics',
      '.lyrics_body'
    ];
    
    const lyrics: string[] = [];
    let foundSelector = '';
    
    for (const selector of selectors) {
      console.log(`🔍 Trying selector: ${selector}`);
      const elements = $(selector);
      console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        foundSelector = selector;
        elements.each((index, element) => {
          const text = $(element).text();
          console.log(`📝 Element ${index} text length: ${text.length}`);
          console.log(`📝 Element ${index} preview:`, text.substring(0, 200));
          
          if (text && text.trim()) {
            const lines = text.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
            lyrics.push(...lines);
          }
        });
        
        if (lyrics.length > 0) {
          console.log(`✅ Found lyrics with selector: ${selector}, total lines: ${lyrics.length}`);
          break;
        }
      }
    }
    
    // セレクターで見つからない場合、HTMLから直接検索
    if (lyrics.length === 0) {
      console.log('🔍 Trying direct HTML search...');
      
      // JSONデータから抽出を試行
      const jsonPatterns = [
        /window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\('([^']+)'\)/,
        /"lyrics":\s*"([^"]+)"/,
        /"body":\s*{\s*"html":\s*"([^"]+)"/,
        /"plain":\s*"([^"]+)"/
      ];
      
      for (const pattern of jsonPatterns) {
        const match = html.match(pattern);
        if (match) {
          console.log(`🔍 Found JSON pattern match`);
          try {
            let jsonStr = match[1];
            if (pattern === jsonPatterns[0]) {
              jsonStr = jsonStr.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              const data = JSON.parse(jsonStr);
              
              // 歌詞データを探す
              const findLyrics = (obj: unknown, path = ''): string | null => {
                if (typeof obj === 'string' && obj.length > 50 && obj.includes('\n')) {
                  console.log(`🔍 Found lyrics in JSON at path: ${path}`);
                  return obj;
                }
                if (typeof obj === 'object' && obj !== null) {
                  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
                    if (key.toLowerCase().includes('lyrics') || key.toLowerCase().includes('body')) {
                      const result = findLyrics(value, `${path}.${key}`);
                      if (result) return result;
                    }
                  }
                  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
                    const result = findLyrics(value, `${path}.${key}`);
                    if (result) return result;
                  }
                }
                return null;
              };
              
              const lyricsText = findLyrics(data);
              if (lyricsText) {
                const cleanText = lyricsText.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n');
                const lines = cleanText.split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0);
                lyrics.push(...lines);
                console.log(`✅ Found lyrics from JSON: ${lines.length} lines`);
                break;
              }
            } else {
              const cleanText = jsonStr.replace(/\\n/g, '\n').replace(/\\"/g, '"');
              const lines = cleanText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
              if (lines.length > 5) {
                lyrics.push(...lines);
                console.log(`✅ Found lyrics from pattern: ${lines.length} lines`);
                break;
              }
            }
          } catch (jsonError) {
            console.log('❌ JSON parse failed:', jsonError);
          }
        }
      }
    }
    
    console.log(`📊 Raw lyrics count: ${lyrics.length}`);
    console.log(`📊 First few raw lyrics:`, lyrics.slice(0, 5));
    
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
          /^see .* live/i,
          /^get tickets/i,
          /^\d+k?$/i, // 数字のみの行
        ];
        
        return !excludePatterns.some(pattern => pattern.test(trimmed));
      })
      .slice(0, 50); // 最大50行
    
    console.log(`✅ Final cleaned lyrics count: ${cleanedLyrics.length}`);
    console.log(`✅ Used selector: ${foundSelector || 'JSON extraction'}`);
    console.log(`✅ Sample cleaned lyrics:`, cleanedLyrics.slice(0, 3));
    
    return cleanedLyrics;
    
  } catch (error) {
    console.error('❌ Lyrics extraction error:', error);
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
