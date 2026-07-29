import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, VoiceDetectorSettings, VoiceDetectorStats } from '../types';

interface UseVoiceDetectorProps {
  isPlaying: boolean;
  onPauseForVoice: () => void;
  onResumeFromSilence: () => void;
}

export function useVoiceDetector({
  isPlaying,
  onPauseForVoice,
  onResumeFromSilence,
}: UseVoiceDetectorProps) {
  const [settings, setSettings] = useState<VoiceDetectorSettings>({
    enabled: false,
    thresholdDb: -22, // -22 dB default speech threshold (requires louder/near-field speech to prevent false triggers)
    silenceDelaySeconds: 5, // 5 seconds
    useSpeechFilter: true, // bandpass for voice frequencies
    noiseFloorDb: -80,
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('disabled');
  const [stats, setStats] = useState<VoiceDetectorStats>({
    currentDb: -100,
    normalizedVolume: 0,
    thresholdVolume: 35, // 0 - 100 scale
    isSpeaking: false,
    countdownRemaining: 5.0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio nodes & refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bandpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Logic refs to keep loop updated without stale closures
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const wasPausedByVoiceRef = useRef(false);
  const countdownTimerRef = useRef<number>(settings.silenceDelaySeconds);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const isSpeakingRef = useRef<boolean>(false);

  // Callback refs
  const onPauseForVoiceRef = useRef(onPauseForVoice);
  onPauseForVoiceRef.current = onPauseForVoice;

  const onResumeFromSilenceRef = useRef(onResumeFromSilence);
  onResumeFromSilenceRef.current = onResumeFromSilence;

  // Calculate dB to normalized volume percentage (0 - 100)
  const dbToVolumePercent = useCallback((db: number) => {
    // Range from -80 dB (0%) to 0 dB (100%)
    const clamped = Math.max(-80, Math.min(0, db));
    return Math.round(((clamped + 80) / 80) * 100);
  }, []);

  // Stop microphone & cleanup audio context
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    bandpassFilterRef.current = null;
  }, []);

  // Main real-time audio analysis loop
  const processAudioFrame = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const fftSize = analyser.fftSize;
    const timeData = new Uint8Array(fftSize);
    analyser.getByteTimeDomainData(timeData);

    // Calculate RMS (Root Mean Square) volume amplitude
    let sumSquares = 0;
    for (let i = 0; i < fftSize; i++) {
      const normalized = (timeData[i] - 128) / 128; // -1.0 to 1.0
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / fftSize);

    // Convert RMS to Decibels (dB)
    // Avoid log(0)
    const currentDb = rms > 0.00001 ? 20 * Math.log10(rms) : -100;
    const currentVolPct = dbToVolumePercent(currentDb);
    const thresholdVolPct = dbToVolumePercent(settingsRef.current.thresholdDb);

    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000; // seconds
    lastFrameTimeRef.current = now;

    // Check if current volume exceeds threshold
    const speaksNow = currentDb >= settingsRef.current.thresholdDb;
    isSpeakingRef.current = speaksNow;

    if (speaksNow) {
      // SPEECH DETECTED!
      countdownTimerRef.current = settingsRef.current.silenceDelaySeconds;

      // If music is playing OR was previously paused by voice, trigger pause action
      if (isPlayingRef.current || wasPausedByVoiceRef.current) {
        if (isPlayingRef.current) {
          wasPausedByVoiceRef.current = true;
          onPauseForVoiceRef.current();
        }
        setVoiceState('speaking');
      }

      setStats({
        currentDb: Math.round(currentDb),
        normalizedVolume: currentVolPct,
        thresholdVolume: thresholdVolPct,
        isSpeaking: true,
        countdownRemaining: settingsRef.current.silenceDelaySeconds,
      });
    } else {
      // SILENCE (below threshold)
      if (wasPausedByVoiceRef.current) {
        // We are in silence countdown phase
        countdownTimerRef.current = Math.max(0, countdownTimerRef.current - deltaTime);
        
        if (countdownTimerRef.current > 0) {
          setVoiceState('countdown');
        } else {
          // Countdown complete (5 seconds silence finished!)
          wasPausedByVoiceRef.current = false;
          setVoiceState('listening');
          onResumeFromSilenceRef.current();
        }
      } else {
        setVoiceState('listening');
      }

      setStats({
        currentDb: Math.round(currentDb),
        normalizedVolume: currentVolPct,
        thresholdVolume: thresholdVolPct,
        isSpeaking: false,
        countdownRemaining: Math.round(countdownTimerRef.current * 10) / 10,
      });
    }

    // Schedule next frame loop
    animationFrameRef.current = requestAnimationFrame(processAudioFrame);
  }, [dbToVolumePercent]);

  // Start listening to mic
  const startListening = useCallback(async () => {
    setErrorMessage(null);
    setVoiceState('requesting');

    try {
      // Request mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create AudioContext
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      if (settings.useSpeechFilter) {
        // Voice Bandpass Filter (300Hz - 3400Hz)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1850; // Center frequency
        filter.Q.value = 0.8; // Bandwidth
        bandpassFilterRef.current = filter;

        source.connect(filter);
        filter.connect(analyser);
      } else {
        source.connect(analyser);
      }

      lastFrameTimeRef.current = performance.now();
      countdownTimerRef.current = settings.silenceDelaySeconds;
      setVoiceState('listening');

      // Start processing
      processAudioFrame();
    } catch (err: any) {
      console.error('Microphone error:', err);
      let msg = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission denied. Please click the lock icon in your browser address bar to allow microphone access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone found on your device.';
      }
      setErrorMessage(msg);
      setVoiceState('error');
      setSettings((prev) => ({ ...prev, enabled: false }));
    }
  }, [processAudioFrame, settings.silenceDelaySeconds, settings.useSpeechFilter]);

  // Toggle Auto Voice Pause ON/OFF with Retry support
  const toggleEnabled = useCallback(() => {
    setErrorMessage(null);
    setSettings((prev) => {
      const nextEnabled = !prev.enabled;
      if (!nextEnabled) {
        cleanupAudio();
        setVoiceState('disabled');
        wasPausedByVoiceRef.current = false;
      }
      return { ...prev, enabled: nextEnabled };
    });
  }, [cleanupAudio]);

  // Effect to start/stop listening based on settings.enabled
  useEffect(() => {
    if (settings.enabled && voiceState === 'disabled') {
      startListening();
    }
  }, [settings.enabled, voiceState, startListening]);

  // Auto Noise Floor Calibration
  const autoCalibrateNoiseFloor = useCallback(() => {
    if (!analyserRef.current) return;

    let totalDb = 0;
    let samples = 0;
    const analyser = analyserRef.current;
    const timeData = new Uint8Array(analyser.fftSize);

    const interval = setInterval(() => {
      analyser.getByteTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const norm = (timeData[i] - 128) / 128;
        sum += norm * norm;
      }
      const rms = Math.sqrt(sum / timeData.length);
      const db = rms > 0.00001 ? 20 * Math.log10(rms) : -80;
      totalDb += db;
      samples++;

      if (samples >= 15) { // 1.5s calibration sample
        clearInterval(interval);
        const avgNoiseDb = totalDb / samples;
        // Set threshold slightly above background noise floor (+12 dB)
        const recommendedThreshold = Math.min(-15, Math.max(-60, Math.round(avgNoiseDb + 12)));
        setSettings((prev) => ({
          ...prev,
          noiseFloorDb: Math.round(avgNoiseDb),
          thresholdDb: recommendedThreshold,
        }));
      }
    }, 100);
  }, []);

  // Update threshold Db
  const setThresholdDb = useCallback((db: number) => {
    setSettings((prev) => ({ ...prev, thresholdDb: db }));
  }, []);

  // Update silence delay seconds
  const setSilenceDelaySeconds = useCallback((sec: number) => {
    setSettings((prev) => ({ ...prev, silenceDelaySeconds: sec }));
    countdownTimerRef.current = sec;
  }, []);

  // Update speech filter
  const setUseSpeechFilter = useCallback((val: boolean) => {
    setSettings((prev) => ({ ...prev, useSpeechFilter: val }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Reset wasPausedByVoice when user manually plays/pauses
  const notifyUserManualPlay = useCallback(() => {
    wasPausedByVoiceRef.current = false;
  }, []);

  return {
    settings,
    voiceState,
    stats,
    errorMessage,
    toggleEnabled,
    setThresholdDb,
    setSilenceDelaySeconds,
    setUseSpeechFilter,
    autoCalibrateNoiseFloor,
    notifyUserManualPlay,
  };
}
