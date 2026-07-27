import React from 'react';
import { Radio, Settings, Download, Mic, MicOff, Volume2 } from 'lucide-react';
import { VoiceState } from '../types';

interface HeaderProps {
  voiceState: VoiceState;
  autoVoiceEnabled: boolean;
  onToggleAutoVoice: () => void;
  onOpenSettings: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPwa: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  voiceState,
  autoVoiceEnabled,
  onToggleAutoVoice,
  onOpenSettings,
  deferredPrompt,
  onInstallPwa,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Radio className="w-5 h-5 text-black font-bold animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight flex items-center gap-2">
              Smart Player
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWA
              </span>
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Auto-pauses music when you speak & resumes after 5s
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Voice Toggle Button */}
          <button
            onClick={onToggleAutoVoice}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              autoVoiceEnabled
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10'
            }`}
          >
            {autoVoiceEnabled ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Auto Voice: ON</span>
                <span className="xs:hidden">Voice ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Auto Voice: OFF</span>
                <span className="xs:hidden">Voice OFF</span>
              </>
            )}
          </button>

          {/* PWA Install Button if available */}
          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/15 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Voice Detection Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

// Global PWA Event Interface
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
