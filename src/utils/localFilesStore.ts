import { Track } from '../types';

/**
 * Utility to manage local device audio & video tracks in IndexedDB
 * so offline device files persist across browser sessions without remote upload.
 */
const DB_NAME = 'EarproLocalMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'local_tracks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalTrackToIDB(track: Track, file: File): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      coverUrl: track.coverUrl,
      fileBlob: file, // Store actual file binary in IndexedDB
      fileName: file.name,
      fileType: file.type,
      isCustom: true,
      timestamp: Date.now(),
    };

    store.put(record);
  } catch (err) {
    console.warn('Failed to save track to IndexedDB:', err);
  }
}

export async function loadSavedLocalTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result || [];
        const tracks: Track[] = records.map((rec: any) => {
          const blobUrl = URL.createObjectURL(rec.fileBlob);
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist,
            album: rec.album,
            duration: rec.duration || 0,
            coverUrl: rec.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
            audioUrl: blobUrl,
            isCustom: true,
          };
        });
        resolve(tracks);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Error loading local tracks from IndexedDB:', err);
    return [];
  }
}

export async function removeLocalTrackFromIDB(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(trackId);
  } catch (err) {
    console.warn('Failed to delete track from IndexedDB:', err);
  }
}
