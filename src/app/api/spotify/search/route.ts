import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// トークンキャッシュ
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Spotifyアクセストークンを取得（キャッシュ付き）
async function getSpotifyAccessToken() {
  console.log('=== Getting Spotify Access Token ===');
  
  // キャッシュされたトークンが有効な場合は再利用
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log('Using cached token');
    return cachedToken;
  }

  console.log('Fetching new access token...');
  console.log('CLIENT_ID for token request:', CLIENT_ID ? 'Available' : 'Missing');
  console.log('CLIENT_SECRET for token request:', CLIENT_SECRET ? 'Available' : 'Missing');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Spotify credentials missing for token request');
  }

  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  console.log('Auth string created, length:', authString.length);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authString}`,
    },
    body: 'grant_type=client_credentials',
  });

  console.log('Token response status:', response.status);
  console.log('Token response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token request failed:', errorText);
    throw new Error(`Failed to get Spotify access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Token data received:', !!data.access_token);
  console.log('Token expires in:', data.expires_in, 'seconds');
  
  cachedToken = data.access_token;
  // トークンの有効期限を設定（実際の有効期限より少し短めに設定）
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  
  return cachedToken;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('=== Spotify Search API Debug ===');
  console.log('Query:', query);
  console.log('CLIENT_ID available:', !!CLIENT_ID);
  console.log('CLIENT_SECRET available:', !!CLIENT_SECRET);

  if (!query) {
    console.log('Error: No query parameter provided');
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('Error: Spotify API credentials not configured');
    console.log('CLIENT_ID:', CLIENT_ID ? 'Set' : 'Missing');
    console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'Set' : 'Missing');
    return NextResponse.json({ 
      error: 'Spotify API credentials not configured',
      debug: {
        clientId: !!CLIENT_ID,
        clientSecret: !!CLIENT_SECRET
      }
    }, { status: 500 });
  }

  try {
    console.log('Getting Spotify access token...');
    const accessToken = await getSpotifyAccessToken();
    console.log('Access token obtained:', !!accessToken);

    const searchUrl = `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
    console.log('Search URL:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Search response status:', searchResponse.status);
    console.log('Search response ok:', searchResponse.ok);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Spotify API error response:', errorText);
      throw new Error(`Spotify API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search data received, tracks count:', searchData.tracks?.items?.length || 0);
    
    const tracks = searchData.tracks.items.map((track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string; height: number; width: number }> };
      preview_url: string | null;
      external_urls: { spotify: string };
      duration_ms: number;
    }) => {
      // 画像URLを取得（複数サイズから適切なものを選択）
      let imageUrl = null;
      if (track.album.images && track.album.images.length > 0) {
        // 中サイズの画像を優先（300x300程度）
        const mediumImage = track.album.images.find(img => img.height >= 200 && img.height <= 400);
        imageUrl = mediumImage?.url || track.album.images[0]?.url;
      }
      
      console.log(`Track: ${track.name}, Image URL: ${imageUrl}`);
      
      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album.name,
        preview_url: track.preview_url,
        external_urls: track.external_urls.spotify,
        image: imageUrl,
        duration_ms: track.duration_ms,
      };
    });

    console.log('Processed tracks count:', tracks.length);
    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Spotify search error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search tracks',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          query,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
