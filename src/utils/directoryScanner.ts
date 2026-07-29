import { Track } from '../types';
import { saveLocalTrackToIDB } from './localFilesStore';

/**
 * Scan a directory recursively using File System Access API (showDirectoryPicker)
 * or webkitGetAsEntry if dragged/selected.
 */
export async function scanDirectoryForMediaFiles(
  dirHandle: any,
  onTracksFound: (tracks: Track[]) => void
): Promise<void> {
  const foundFiles: File[] = [];

  async function readDirectory(handle: any) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (isMediaFile(file)) {
          foundFiles.push(file);
        }
      } else if (entry.kind === 'directory') {
        await readDirectory(entry);
      }
    }
  }

  try {
    await readDirectory(dirHandle);
    if (foundFiles.length > 0) {
      const tracks: Track[] = foundFiles.map((file, idx) => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|3gp)$/i.test(file.name);
        const objectUrl = URL.createObjectURL(file);
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

        const track: Track = {
          id: `dir-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle,
          artist: isVideo ? 'Offline Video MP3' : 'Offline Device Song',
          album: 'Device Folder',
          duration: 0,
          coverUrl: isVideo
            ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          audioUrl: objectUrl,
          isCustom: true,
        };

        void saveLocalTrackToIDB(track, file);
        return track;
      });

      onTracksFound(tracks);
    }
  } catch (err) {
    console.error('Error scanning directory:', err);
  }
}

function isMediaFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.mp4', '.mkv', '.webm', '.mov', '.avi', '.3gp'];
  return validExtensions.some((ext) => name.endsWith(ext)) || file.type.startsWith('audio/') || file.type.startsWith('video/');
}
