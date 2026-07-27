export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  isCustom?: boolean;
  isGenerated?: boolean;
  isOnline?: boolean;
}

export type VoiceState = 
  | 'disabled'
  | 'requesting'
  | 'listening'
  | 'speaking'
  | 'countdown'
  | 'error';

export interface VoiceDetectorSettings {
  enabled: boolean;
  thresholdDb: number; // e.g. -35 dB
  silenceDelaySeconds: number; // default 5s
  useSpeechFilter: boolean; // 300Hz - 3400Hz voice band focus
  noiseFloorDb: number; // calculated background noise
}

export interface VoiceDetectorStats {
  currentDb: number; // -100 to 0 dB
  normalizedVolume: number; // 0 to 100%
  thresholdVolume: number; // 0 to 100%
  isSpeaking: boolean;
  countdownRemaining: number; // in seconds (e.g. 4.2)
}

export type ActiveTab = 'player' | 'search' | 'playlist' | 'lyrics' | 'settings';
