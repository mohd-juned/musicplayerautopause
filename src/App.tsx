import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVoiceDetector } from './hooks/useVoiceDetector';
import { Header, BeforeInstallPromptEvent } from './components/Header';
import { VoiceDetectorPanel } from './components/VoiceDetectorPanel';
import { PlayerCard } from './components/PlayerCard';
import { Playlist } from './components/Playlist';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Audio Player Hook
  const {
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
    analyserNode,
    playAudio,
    pauseAudio,
    togglePlay,
    playNextTrack,
    playPrevTrack,
    seekTo,
    setVolume,
    toggleMute,
    setIsShuffle,
    setIsRepeat,
    selectTrack,
    addCustomTrack,
    addProceduralTrack,
  } = useAudioPlayer();

  // Voice Detector Hook
  const {
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
  } = useVoiceDetector({
    isPlaying,
    onPauseForVoice: () => {
      pauseAudio();
    },
    onResumeFromSilence: () => {
      playAudio();
    },
  });

  // Handle manual user play/pause toggle
  const handleUserTogglePlay = () => {
    notifyUserManualPlay();
    togglePlay();
  };

  // Catch PWA Install Prompt Event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      setDeferredPrompt(null);
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Header
        voiceState={voiceState}
        autoVoiceEnabled={settings.enabled}
        onToggleAutoVoice={toggleEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Real-time Web Audio Voice Detection Status & Calibration Panel */}
        <VoiceDetectorPanel
          settings={settings}
          voiceState={voiceState}
          stats={stats}
          errorMessage={errorMessage}
          onToggleEnabled={toggleEnabled}
          onSetThresholdDb={setThresholdDb}
          onAutoCalibrate={autoCalibrateNoiseFloor}
        />

        {/* Main Audio Player Component */}
        <PlayerCard
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          audioError={audioError}
          analyserNode={analyserNode}
          onTogglePlay={handleUserTogglePlay}
          onPlayNext={() => {
            notifyUserManualPlay();
            playNextTrack();
          }}
          onPlayPrev={() => {
            notifyUserManualPlay();
            playPrevTrack();
          }}
          onSeek={seekTo}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onToggleShuffle={setIsShuffle}
          onToggleRepeat={setIsRepeat}
        />

        {/* Playlist & Audio File Uploader */}
        <Playlist
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onSelectTrack={(idx) => {
            notifyUserManualPlay();
            selectTrack(idx);
          }}
          onUploadTrack={(file) => {
            notifyUserManualPlay();
            addCustomTrack(file);
          }}
          onGenerateTrack={() => {
            notifyUserManualPlay();
            addProceduralTrack();
          }}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSetSilenceDelay={setSilenceDelaySeconds}
        onSetUseSpeechFilter={setUseSpeechFilter}
      />

      {/* PWA Mobile Installation Toast */}
      <PWAInstallPrompt
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallPwa}
      />
    </div>
  );
}
