import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';
import { PRESET_TRACKS } from '../data/presetTracks';
import { createProceduralTrackUrl } from '../utils/audioSynth';

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

  // Add custom user file track
  const addCustomTrack = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      album: 'User Uploads',
      duration: 0,
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      audioUrl: objectUrl,
      isCustom: true,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
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
    addProceduralTrack,
  };
}
