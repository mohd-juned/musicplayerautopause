import { Track } from '../types';

export interface LyricsData {
  plainLyrics: string | null;
  syncedLyrics: Array<{ time: number; text: string }> | null;
  provider: string;
}

/**
 * Search online songs using the public iTunes Search API (no API key required, CORS supported).
 */
export async function searchOnlineTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(`https://itunes.apple.com/search?term=${encoded}&media=music&limit=30`);
    if (!res.ok) throw new Error('Search request failed');

    const data = await res.json();
    if (!data.results) return [];

    return data.results
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
  } catch (err) {
    console.error('iTunes search error:', err);
    return [];
  }
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
