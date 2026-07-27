import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Disc,
} from 'lucide-react';
import { Track } from '../types';
import { MusicVisualizer } from './MusicVisualizer';

interface PlayerCardProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  audioError: string | null;
  analyserNode: AnalyserNode | null;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (val: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  isRepeat,
  audioError,
  analyserNode,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  // Format seconds -> MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[#181818] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center max-w-xl mx-auto w-full">
      {/* Album Artwork with Glow & Spin effect */}
      <div className="relative group mb-6">
        <div
          className={`absolute -inset-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-40 transition-all duration-700 ${
            isPlaying ? 'opacity-75 scale-105' : 'opacity-20 scale-95'
          }`}
        />
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 flex items-center justify-center">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          ) : (
            <Disc className={`w-20 h-20 text-emerald-400 ${isPlaying ? 'animate-spin' : ''}`} />
          )}

          {/* Vinyl Record overlay icon */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <Disc className={`w-12 h-12 text-white ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
        </div>
      </div>

      {/* Track Details */}
      <div className="text-center w-full mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate px-2">
          {currentTrack.title}
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5 truncate font-medium">
          {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
        </p>

        {currentTrack.isGenerated && (
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Synthesized Track
          </span>
        )}
      </div>

      {/* Real-time Spectrum Visualizer */}
      <div className="w-full mb-4">
        <MusicVisualizer analyserNode={analyserNode} isPlaying={isPlaying} />
      </div>

      {/* Audio Error Alert if any */}
      {audioError && (
        <div className="w-full mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium">
          {audioError}
        </div>
      )}

      {/* Progress Bar & Timers */}
      <div className="w-full space-y-1.5 mb-6">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between items-center text-xs text-zinc-400 font-mono px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Media Controls */}
      <div className="flex items-center justify-between w-full max-w-sm mb-6">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-2.5 rounded-full transition-colors ${
            isShuffle
              ? 'text-emerald-400 bg-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Shuffle Playlist"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous */}
        <button
          onClick={onPlayPrev}
          className="p-3 rounded-full text-white hover:bg-white/10 transition-transform active:scale-95"
          title="Previous Song"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onTogglePlay}
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 hover:scale-105"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-black" />
          ) : (
            <Play className="w-7 h-7 fill-black translate-x-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onPlayNext}
          className="p-3 rounded-full text-white hover:bg-white/10 transition-transform active:scale-95"
          title="Next Song"
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`p-2.5 rounded-full transition-colors ${
            isRepeat
              ? 'text-emerald-400 bg-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Repeat Track"
        >
          <Repeat className="w-5 h-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 w-full max-w-xs px-4 py-2 rounded-2xl bg-zinc-900/60 border border-white/5">
        <button
          onClick={onToggleMute}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => onSetVolume(Number(e.target.value))}
          className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
        />

        <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
  );
};
