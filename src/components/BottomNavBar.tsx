import React from 'react';
import { Disc, Search, Music, Mic, FileText, Play, Pause } from 'lucide-react';
import { ActiveTab, Track, VoiceState } from '../types';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  voiceState: VoiceState;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  currentTrack,
  isPlaying,
  onTogglePlay,
  voiceState,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 sm:px-6">
      <div className="max-w-xl mx-auto flex flex-col gap-2">
        {/* Floating Mini Player (visible when not on Player tab) */}
        {activeTab !== 'player' && (
          <div
            onClick={() => onTabChange('player')}
            className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xl cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative">
                <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                {voiceState === 'speaking' && (
                  <div className="absolute inset-0 bg-amber-500/80 backdrop-blur-[1px] flex items-center justify-center text-[10px] font-bold text-black">
                    Paused
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
                <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black translate-x-0.5" />
              )}
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center justify-around py-1">
          <button
            onClick={() => onTabChange('player')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'player'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-5 h-5" />
            <span className="text-[10px]">Player</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'search'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Search</span>
          </button>

          <button
            onClick={() => onTabChange('playlist')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'playlist'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-5 h-5" />
            <span className="text-[10px]">Library</span>
          </button>

          <button
            onClick={() => onTabChange('lyrics')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'lyrics'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Lyrics</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px]">Auto Pause</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
