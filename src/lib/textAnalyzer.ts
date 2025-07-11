import kuromoji from 'kuromoji';

// kuromoji.jsのトークナイザーをキャッシュ
let tokenizer: kuromoji.Tokenizer | null = null;
let tokenizerPromise: Promise<kuromoji.Tokenizer> | null = null;

// トークナイザーを初期化する関数
async function initializeTokenizer(): Promise<kuromoji.Tokenizer> {
  if (tokenizer) {
    return tokenizer;
  }

  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') {
      reject(new Error('kuromoji.js is only available in browser environment'));
      return;
    }

    try {
      // タイムアウトを設定（10秒）
      const timeout = setTimeout(() => {
        reject(new Error('kuromoji.js initialization timeout'));
      }, 10000);

      kuromoji.builder({ dicPath: '/dict/' }).build((err: Error | null, _tokenizer: kuromoji.Tokenizer) => {
        clearTimeout(timeout);
        
        if (err) {
          console.error('kuromoji initialization error:', err);
          reject(err);
        } else if (!_tokenizer) {
          console.error('kuromoji tokenizer is null');
          reject(new Error('kuromoji tokenizer initialization failed'));
        } else {
          tokenizer = _tokenizer;
          console.log('kuromoji.js tokenizer initialized successfully');
          resolve(_tokenizer);
        }
      });
    } catch (error) {
      console.error('kuromoji builder error:', error);
      reject(error);
    }
  });

  return tokenizerPromise;
}

// 日本語かどうかを判定する関数
function isJapanese(text: string): boolean {
  // ひらがな、カタカナ、漢字を含むかチェック
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

// 英語の歌詞を自然に分割する関数
function splitEnglishLyrics(text: string): string[] {
  const segments: string[] = [];
  
  // 文単位で分割
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    
    // 長い文は句読点やコンマで分割
    const parts = trimmed.split(/[,;:]/).filter(part => part.trim().length > 0);
    
    parts.forEach(part => {
      const words = part.trim().split(/\s+/);
      
      // 3-5単語ごとに分割（自然な語句単位）
      if (words.length > 5) {
        for (let i = 0; i < words.length; i += 3) {
          const segment = words.slice(i, i + 4).join(' ');
          if (segment.trim()) {
            segments.push(segment.trim());
          }
        }
      } else if (words.length > 0) {
        segments.push(part.trim());
      }
    });
  });
  
  return segments.filter(seg => seg.length > 0);
}

// 日本語の歌詞を形態素解析で自然に分割する関数
async function splitJapaneseLyrics(text: string): Promise<string[]> {
  try {
    const _tokenizer = await initializeTokenizer();
    const tokens = _tokenizer.tokenize(text);
    
    const segments: string[] = [];
    let currentSegment = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];
      
      currentSegment += token.surface_form;
      
      // 区切りポイントを判定
      const shouldBreak = 
        // 助詞の後（「が」「を」「に」「で」など）
        (token.part_of_speech.startsWith('助詞') && currentSegment.length >= 2) ||
        // 動詞の活用形の後
        (token.part_of_speech.startsWith('動詞') && currentSegment.length >= 3) ||
        // 形容詞の後
        (token.part_of_speech.startsWith('形容詞') && currentSegment.length >= 3) ||
        // 句読点の後
        (token.surface_form.match(/[、。！？]/) && currentSegment.length >= 1) ||
        // 接続詞の前で区切り
        (nextToken && nextToken.part_of_speech.startsWith('接続詞') && currentSegment.length >= 2) ||
        // 一定の長さに達した場合（読みやすさのため）
        (currentSegment.length >= 8 && token.part_of_speech.startsWith('助詞'));
      
      if (shouldBreak || i === tokens.length - 1) {
        const trimmed = currentSegment.trim();
        if (trimmed.length > 0) {
          segments.push(trimmed);
        }
        currentSegment = '';
      }
    }
    
    return segments.filter(seg => seg.length > 0);
  } catch (error) {
    console.error('Japanese text analysis error:', error);
    // フォールバック：従来の方法
    return splitEnglishLyrics(text);
  }
}

// 歌詞から不要なタグを除去する関数
function cleanLyricsLine(line: string): string {
  // [verse], [chorus], [bridge] などの英語タグを除去
  // [] と () とその中身を全て除去
  let cleaned = line.replace(/\[[^\]]*\]/g, '').trim(); // []とその中身を除去
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim(); // ()とその中身を除去
  return cleaned;
}

// メインの歌詞分割関数
export async function splitLyricsIntoSegments(lyrics: string[]): Promise<string[]> {
  const allSegments: string[] = [];
  
  for (const line of lyrics) {
    if (!line.trim()) continue;
    
    // 不要なタグを除去
    const cleanedLine = cleanLyricsLine(line);
    if (!cleanedLine) continue; // 空行になった場合はスキップ
    
    try {
      let segments: string[];
      
      if (isJapanese(cleanedLine)) {
        // 日本語の場合は形態素解析を使用
        segments = await splitJapaneseLyrics(cleanedLine);
      } else {
        // 英語の場合は従来の方法
        segments = splitEnglishLyrics(cleanedLine);
      }
      
      allSegments.push(...segments);
    } catch (error) {
      console.error('Error processing line:', cleanedLine, error);
      // エラーの場合は行をそのまま追加
      allSegments.push(cleanedLine);
    }
  }
  
  return allSegments.filter(seg => seg.length > 0);
}

// 辞書ファイルをダウンロードする関数（開発時用）
export async function downloadDictionary(): Promise<void> {
  try {
    console.log('Downloading kuromoji dictionary...');
    // 実際の実装では、辞書ファイルをpublicディレクトリに配置する必要があります
    // この関数は開発時の参考用です
  } catch (error) {
    console.error('Dictionary download error:', error);
  }
}

// 簡易版の分割関数（kuromoji.jsが利用できない場合のフォールバック）
export function splitLyricsSimple(lyrics: string[]): string[] {
  const segments: string[] = [];
  
  lyrics.forEach(line => {
    if (!line.trim()) return;
    
    if (isJapanese(line)) {
      // 日本語の場合：助詞や句読点で分割
      const parts = line.split(/([がをにでとへのはもか、。！？])/)
        .filter(part => part.trim().length > 0);
      
      let currentSegment = '';
      for (const part of parts) {
        currentSegment += part;
        
        // 助詞や句読点で区切り
        if (part.match(/[がをにでとへのはもか、。！？]/) || currentSegment.length >= 6) {
          if (currentSegment.trim()) {
            segments.push(currentSegment.trim());
          }
          currentSegment = '';
        }
      }
      
      if (currentSegment.trim()) {
        segments.push(currentSegment.trim());
      }
    } else {
      // 英語の場合
      segments.push(...splitEnglishLyrics(line));
    }
  });
  
  return segments.filter(seg => seg.length > 0);
}
