import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';
import { PRESET_TRACKS } from '../data/presetTracks';
import { createProceduralTrackUrl } from '../utils/audioSynth';
import {
  saveLocalTrackToIDB,
  loadSavedLocalTracks,
  removeLocalTrackFromIDB,
} from '../utils/localFilesStore';

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>(PRESET_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Restore saved local offline tracks from IndexedDB on initial boot
  useEffect(() => {
    let isMounted = true;
    loadSavedLocalTracks().then((savedTracks) => {
      if (isMounted && savedTracks.length > 0) {
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueNew = savedTracks.filter((t) => !existingIds.has(t.id));
          return [...uniqueNew, ...prev];
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize HTMLAudioElement once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack.duration || 0);
      setAudioError(null);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNextTrack();
      }
    };

    const handleError = () => {
      console.warn('Audio play error, creating procedural fallback synth audio...');
      setAudioError('Failed to stream audio file. Switching to generated lo-fi track...');
      // Generate procedural track fallback if external source blocked
      void createProceduralTrackUrl('lofi').then((blobUrl) => {
        if (blobUrl && audioRef.current) {
          audioRef.current.src = blobUrl;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat]);

  // Handle track source changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;
    const wasPlaying = isPlaying;

    audio.src = currentTrack.audioUrl;
    audio.load();
    setCurrentTime(0);

    if (wasPlaying) {
      audio.play().catch((err) => {
        console.warn('Autoplay prevented or failed:', err);
        setIsPlaying(false);
      });
    }

    // MediaSession API setup for Lock Screen & Control Center
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => playAudio());
      navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
    }
  }, [currentTrackIndex, currentTrack]);

  // Connect AudioContext analyser node for music visualizer
  const initAudioAnalyser = useCallback(() => {
    if (analyserRef.current || !audioRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch (e) {
      console.warn('Web Audio API visualizer init skipped/CORS restriction:', e);
    }
  }, []);

  // Play audio
  const playAudio = useCallback(() => {
    if (!audioRef.current) return;
    initAudioAnalyser();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      })
      .catch((err) => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
  }, [initAudioAnalyser]);

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);

  // Play next track
  const playNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
  }, [tracks.length, isShuffle]);

  // Play prev track
  const playPrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // If played more than 3s, restart current song
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  }, [tracks.length]);

  // Seek position
  const seekTo = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  // Set Volume
  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
  }, [isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMute = !prev;
      if (audioRef.current) {
        audioRef.current.volume = nextMute ? 0 : volume;
      }
      return nextMute;
    });
  }, [volume]);

  // Select track by index
  const selectTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  }, []);

  // Add batch of local audio & video files (Offline MP3/Video songs)
  const addLocalFilesBatch = useCallback((items: FileList | File[] | Track[]) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return;

    // Check if items are already Track objects
    if (Array.isArray(items) && items.length > 0 && 'audioUrl' in items[0]) {
      const trackArray = items as Track[];
      setTracks((prev) => [...trackArray, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      return;
    }

    const fileArray = Array.from(items as FileList | File[]);
    if (fileArray.length === 0) return;

    const newTracks: Track[] = [];

    fileArray.forEach((file, index) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|3gp)$/i.test(file.name);
      const objectUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

      const track: Track = {
        id: `local-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        artist: isVideo ? 'Offline Video (Audio Track)' : 'Offline Local MP3',
        album: 'Device Storage',
        duration: 0,
        coverUrl: isVideo
          ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        audioUrl: objectUrl,
        isCustom: true,
      };

      newTracks.push(track);

      // Save asynchronously to IndexedDB for persistent offline playback
      void saveLocalTrackToIDB(track, file);
    });

    setTracks((prev) => [...newTracks, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  }, []);

  // Add custom single user file track
  const addCustomTrack = useCallback((file: File) => {
    addLocalFilesBatch([file]);
  }, [addLocalFilesBatch]);

  // Remove track from playlist and IndexedDB
  const removeTrack = useCallback((trackId: string) => {
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== trackId);
      return filtered;
    });
    void removeLocalTrackFromIDB(trackId);
  }, []);

  // Pick directory via File System Access API and recursively scan & import all audio files
  const pickAndImportDirectory = useCallback(async (): Promise<Track[]> => {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API (showDirectoryPicker) is not supported in this browser.');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const foundFiles: File[] = [];

      // Recursive scan helper
      async function readDirectory(handle: any) {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.mp4', '.mkv', '.webm', '.mov', '.avi', '.3gp'];
            if (validExtensions.includes(ext) || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
              foundFiles.push(file);
            }
          } else if (entry.kind === 'directory') {
            await readDirectory(entry);
          }
        }
      }

      await readDirectory(dirHandle);

      if (foundFiles.length === 0) {
        return [];
      }

      const importedTracks: Track[] = foundFiles.map((file, index) => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|3gp)$/i.test(file.name);
        const objectUrl = URL.createObjectURL(file);
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

        const track: Track = {
          id: `fs-dir-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
          title: cleanTitle,
          artist: isVideo ? 'Offline Video MP3 Stream' : 'Offline Local Track',
          album: 'Device Folder',
          duration: 0,
          coverUrl: isVideo
            ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          audioUrl: objectUrl,
          isCustom: true,
        };

        // Persist track binary asynchronously in IndexedDB
        void saveLocalTrackToIDB(track, file);
        return track;
      });

      setTracks((prev) => [...importedTracks, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);

      return importedTracks;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory scan error:', err);
      }
      throw err;
    }
  }, []);

  // Generate procedural lo-fi track
  const addProceduralTrack = useCallback(async () => {
    const blobUrl = await createProceduralTrackUrl('lofi');
    if (!blobUrl) return;

    const synthTrack: Track = {
      id: `synth-${Date.now()}`,
      title: 'Procedural Lo-Fi Chill',
      artist: 'Smart Synth Engine',
      album: 'AI Waveforms',
      duration: 30,
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      audioUrl: blobUrl,
      isGenerated: true,
    };

    setTracks((prev) => [synthTrack, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  }, []);

  return {
    tracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    audioError,
    analyserNode: analyserRef.current,
    playAudio,
    pauseAudio,
    togglePlay,
    playNextTrack,
    playPrevTrack,
    seekTo,
    setVolume,
    toggleMute,
    setIsShuffle: () => setIsShuffle((prev) => !prev),
    setIsRepeat: () => setIsRepeat((prev) => !prev),
    selectTrack,
    addCustomTrack,
    addLocalFilesBatch,
    pickAndImportDirectory,
    removeTrack,
    addProceduralTrack,
  };
}
