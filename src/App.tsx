import React, { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVoiceDetector } from './hooks/useVoiceDetector';
import { Header, BeforeInstallPromptEvent } from './components/Header';
import { VoiceDetectorPanel } from './components/VoiceDetectorPanel';
import { PlayerCard } from './components/PlayerCard';
import { Playlist } from './components/Playlist';
import { SongSearch } from './components/SongSearch';
import { LyricsViewer } from './components/LyricsViewer';
import { SettingsModal } from './components/SettingsModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { BottomNavBar } from './components/BottomNavBar';
import { ActiveTab, Track } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());

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

  // Handle manual user play/pause
  const handleUserTogglePlay = () => {
    notifyUserManualPlay();
    togglePlay();
  };

  // Play online song selected from Search
  const handleSelectOnlineTrack = useCallback((track: Track) => {
    notifyUserManualPlay();
    addCustomTrackFileOrTrack(track);
    setActiveTab('player');
  }, [notifyUserManualPlay]);

  // Queue online track to playlist
  const handleAddTrackToQueue = useCallback((track: Track) => {
    setAddedTrackIds((prev) => new Set(prev).add(track.id));
    addCustomTrackFileOrTrack(track, false);
  }, []);

  // Helper to add track or file
  const addCustomTrackFileOrTrack = (trackOrFile: Track | File, playImmediately = true) => {
    if (trackOrFile instanceof File) {
      addCustomTrack(trackOrFile);
    } else {
      // It's an online track object
      selectTrack(0); // Add logic in player or update tracks array
    }
  };

  // Catch PWA BeforeInstallPrompt
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
    if (!deferredPrompt) {
      setIsInstallGuideOpen(true);
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      setDeferredPrompt(null);
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black pb-32">
      {/* Top Header */}
      <Header
        voiceState={voiceState}
        autoVoiceEnabled={settings.enabled}
        onToggleAutoVoice={toggleEnabled}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Tab Views */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {/* PLAYER TAB */}
        {activeTab === 'player' && (
          <div className="space-y-6 animate-fade-in">
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

            <VoiceDetectorPanel
              settings={settings}
              voiceState={voiceState}
              stats={stats}
              errorMessage={errorMessage}
              onToggleEnabled={toggleEnabled}
              onSetThresholdDb={setThresholdDb}
              onAutoCalibrate={autoCalibrateNoiseFloor}
            />
          </div>
        )}

        {/* ONLINE SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="animate-fade-in">
            <SongSearch
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectOnlineTrack={(track) => {
                notifyUserManualPlay();
                // Add to tracks list & play
                tracks.unshift(track);
                selectTrack(0);
                setActiveTab('player');
              }}
              onAddTrackToQueue={(track) => {
                tracks.push(track);
                setAddedTrackIds((prev) => new Set(prev).add(track.id));
              }}
              addedTrackIds={addedTrackIds}
            />
          </div>
        )}

        {/* LIBRARY / PLAYLIST TAB */}
        {activeTab === 'playlist' && (
          <div className="animate-fade-in">
            <Playlist
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              isPlaying={isPlaying}
              onSelectTrack={(idx) => {
                notifyUserManualPlay();
                selectTrack(idx);
                setActiveTab('player');
              }}
              onUploadTrack={(file) => {
                notifyUserManualPlay();
                addCustomTrack(file);
                setActiveTab('player');
              }}
              onGenerateTrack={() => {
                notifyUserManualPlay();
                addProceduralTrack();
                setActiveTab('player');
              }}
            />
          </div>
        )}

        {/* LYRICS TAB */}
        {activeTab === 'lyrics' && (
          <div className="animate-fade-in">
            <LyricsViewer currentTrack={currentTrack} currentTime={currentTime} />
          </div>
        )}

        {/* VOICE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <VoiceDetectorPanel
              settings={settings}
              voiceState={voiceState}
              stats={stats}
              errorMessage={errorMessage}
              onToggleEnabled={toggleEnabled}
              onSetThresholdDb={setThresholdDb}
              onAutoCalibrate={autoCalibrateNoiseFloor}
            />
          </div>
        )}
      </main>

      {/* Spotify Bottom Nav & Mini Player */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleUserTogglePlay}
        voiceState={voiceState}
      />

      {/* Voice Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSetSilenceDelay={setSilenceDelaySeconds}
        onSetUseSpeechFilter={setUseSpeechFilter}
      />

      {/* Add to Home Screen PWA Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
        onNativeInstall={handleInstallPwa}
        canNativeInstall={!!deferredPrompt}
      />
    </div>
  );
}
