import { Track } from '../types';

export interface LyricsData {
  plainLyrics: string | null;
  syncedLyrics: Array<{ time: number; text: string }> | null;
  provider: string;
}

/**
 * Search online songs using multi-source fallbacks (iTunes IN, iTunes US, JioSaavn API, Deezer Proxy).
 * Ensures search works smoothly on Vercel deployments and mobile devices across all regions.
 */
export async function searchOnlineTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());

  // 1. Try JioSaavn Dev API first (Great for Hindi, English, Punjabi, Bollywood & Global Music)
  try {
    const saavnRes = await fetch(`https://saavn.dev/api/search/songs?query=${encoded}&limit=25`);
    if (saavnRes.ok) {
      const saavnData = await saavnRes.json();
      const results = saavnData?.data?.results || saavnData?.data;
      if (Array.isArray(results) && results.length > 0) {
        const tracks: Track[] = results
          .filter((item: any) => item.name && (item.downloadUrl || item.media_url))
          .map((item: any) => {
            // Find best audio URL (prefer 320kbps or highest quality)
            let audioUrl = '';
            if (Array.isArray(item.downloadUrl) && item.downloadUrl.length > 0) {
              const bestQuality = item.downloadUrl[item.downloadUrl.length - 1];
              audioUrl = bestQuality.url || bestQuality.link || item.downloadUrl[0].url;
            } else if (typeof item.downloadUrl === 'string') {
              audioUrl = item.downloadUrl;
            } else if (item.media_url) {
              audioUrl = item.media_url;
            }

            // Find best cover image
            let coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
            if (Array.isArray(item.image) && item.image.length > 0) {
              coverUrl = item.image[item.image.length - 1].url || item.image[0].url;
            } else if (typeof item.image === 'string') {
              coverUrl = item.image;
            }

            return {
              id: `saavn-${item.id}`,
              title: cleanHtmlEntities(item.name),
              artist: cleanHtmlEntities(item.primaryArtists || item.artist || 'Unknown Artist'),
              album: cleanHtmlEntities(item.album?.name || item.album || 'Single'),
              duration: item.duration ? parseInt(item.duration, 10) : 180,
              coverUrl: coverUrl.replace('http:', 'https:'),
              audioUrl: audioUrl.replace('http:', 'https:'),
              isOnline: true,
            };
          })
          .filter((t) => t.audioUrl);

        if (tracks.length > 0) {
          return tracks;
        }
      }
    }
  } catch (e) {
    console.warn('JioSaavn search skipped, trying iTunes multi-region...', e);
  }

  // 2. Try iTunes API with India region (country=IN)
  try {
    const itunesInRes = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=25&country=IN`
    );
    if (itunesInRes.ok) {
      const data = await itunesInRes.json();
      if (data?.results && data.results.length > 0) {
        return parseItunesResults(data.results);
      }
    }
  } catch (e) {
    console.warn('iTunes IN search failed, trying iTunes US...', e);
  }

  // 3. Fallback: iTunes API Global (country=US)
  try {
    const itunesUsRes = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=25&country=US`
    );
    if (itunesUsRes.ok) {
      const data = await itunesUsRes.json();
      if (data?.results && data.results.length > 0) {
        return parseItunesResults(data.results);
      }
    }
  } catch (e) {
    console.warn('iTunes US search failed, trying Deezer proxy...', e);
  }

  // 4. Fallback: Deezer Proxy Search
  try {
    const deezerRes = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(`https://api.deezer.com/search?q=${encoded}&limit=25`)}`
    );
    if (deezerRes.ok) {
      const deezerData = await deezerRes.json();
      if (deezerData?.data && Array.isArray(deezerData.data) && deezerData.data.length > 0) {
        return deezerData.data
          .filter((item: any) => item.preview && item.title)
          .map((item: any) => ({
            id: `deezer-${item.id}`,
            title: item.title,
            artist: item.artist?.name || 'Unknown Artist',
            album: item.album?.title || 'Single',
            duration: item.duration || 30,
            coverUrl: item.album?.cover_medium || item.album?.cover_big || '',
            audioUrl: item.preview,
            isOnline: true,
          }));
      }
    }
  } catch (e) {
    console.error('All online music search APIs failed:', e);
  }

  return [];
}

/** Helper to clean HTML entities like &quot; &amp; &#039; from song titles */
function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Helper to format iTunes API items */
function parseItunesResults(results: any[]): Track[] {
  return results
    .filter((item: any) => item.previewUrl && item.trackName)
    .map((item: any) => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName || 'Unknown Artist',
      album: item.collectionName || 'Single',
      duration: 30, // iTunes previews are 30 seconds
      coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
      audioUrl: item.previewUrl,
      isOnline: true,
    }));
}

/**
 * Fetch lyrics from the free open-source LRCLIB API.
 */
export async function fetchTrackLyrics(title: string, artist: string): Promise<LyricsData> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${query}`);
    
    if (!searchRes.ok) {
      return { plainLyrics: null, syncedLyrics: null, provider: 'LRCLIB' };
    }

    const results = await searchRes.json();
    if (!results || results.length === 0) {
      return { plainLyrics: null, syncedLyrics: null, provider: 'LRCLIB' };
    }

    // Pick best match
    const match = results[0];
    const plain = match.plainLyrics || null;
    const syncedRaw = match.syncedLyrics || null;

    let parsedSynced: Array<{ time: number; text: string }> | null = null;

    if (syncedRaw) {
      parsedSynced = parseLrc(syncedRaw);
    }

    return {
      plainLyrics: plain,
      syncedLyrics: parsedSynced,
      provider: 'LRCLIB Community',
    };
  } catch (e) {
    console.warn('Lyrics fetch error:', e);
    return { plainLyrics: null, syncedLyrics: null, provider: 'LRCLIB' };
  }
}

/**
 * Parse standard LRC format string: [00:12.34] Line of text
 */
function parseLrc(lrc: string): Array<{ time: number; text: string }> {
  const lines = lrc.split('\n');
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = parseInt(match[3].padEnd(3, '0').substring(0, 3), 10);
      const timeInSeconds = minutes * 60 + seconds + millis / 1000;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        result.push({ time: timeInSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
