import React, { useRef } from 'react';
import { Music, Upload, Sparkles, Play, Volume2, Plus } from 'lucide-react';
import { Track } from '../types';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onUploadTrack: (file: File) => void;
  onGenerateTrack: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
  onUploadTrack,
  onGenerateTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadTrack(file);
      e.target.value = '';
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || secs <= 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Header & Upload Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Your Playlist</h3>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-full border border-white/5">
            {tracks.length} tracks
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Audio</span>
          </button>

          <button
            onClick={onGenerateTrack}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
            title="Synthesize procedural Lo-Fi track offline"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synthesize Lo-Fi</span>
          </button>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {tracks.map((track, idx) => {
          const isActive = idx === currentTrackIndex;

          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(idx)}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                  : 'hover:bg-white/5 text-zinc-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Index / Playing icon */}
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-zinc-500" />
                  )}

                  {isActive && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                      {isPlaying ? (
                        <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold truncate ${
                      isActive ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-zinc-400">
                {track.isCustom && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                    Local
                  </span>
                )}
                <span>{formatDuration(track.duration)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
