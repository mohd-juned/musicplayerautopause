import React, { useRef, useState } from 'react';
import { Music, FolderPlus, Sparkles, Play, Volume2, Trash2, HardDrive, Video, FolderSearch, Search, X } from 'lucide-react';
import { Track } from '../types';
import { scanDirectoryForMediaFiles } from '../utils/directoryScanner';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onUploadTrack: (file: File) => void;
  onBatchLocalTracks?: (files: FileList | File[] | Track[]) => void;
  onPickDirectory?: () => Promise<Track[]>;
  onRemoveTrack?: (trackId: string) => void;
  onGenerateTrack: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
  onUploadTrack,
  onBatchLocalTracks,
  onPickDirectory,
  onRemoveTrack,
  onGenerateTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDirectoryPick = async () => {
    if (onPickDirectory) {
      try {
        await onPickDirectory();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('onPickDirectory fallback to standard picker:', err);
      }
    }

    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        await scanDirectoryForMediaFiles(dirHandle, (newTracks) => {
          if (onBatchLocalTracks && newTracks.length > 0) {
            onBatchLocalTracks(newTracks);
          }
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Directory picker fallback:', err);
          fileInputRef.current?.click();
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // Auto prompt picker when user switches to library if no custom local tracks loaded yet
  React.useEffect(() => {
    const hasLocal = tracks.some((t) => t.isCustom);
    if (!hasLocal) {
      // Small timeout to allow render before native dialog
      const timer = setTimeout(() => {
        handleDirectoryPick().catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (onBatchLocalTracks) {
        onBatchLocalTracks(files);
      } else {
        onUploadTrack(files[0]);
      }
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
    <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Offline Device Direct Scan Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Offline Phone / Storage Audio & Videos</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                DIRECT NO UPLOAD
              </span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Scan all offline MP3 songs & MP4/MKV videos directly from phone memory. Plays instantly as audio without uploading.
            </p>
          </div>
        </div>

        <button
          onClick={handleDirectoryPick}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
        >
          <FolderSearch className="w-4 h-4" />
          <span>Auto Scan Phone Music Folder</span>
        </button>
      </div>

      {/* Header & Upload Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Your Songs & Offline Library</h3>
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
            accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.mp4,.mkv,.webm,.mov,.avi,.3gp"
            multiple
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Files / Folders</span>
          </button>

          <button
            onClick={onGenerateTrack}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
            title="Synthesize procedural Lo-Fi track offline"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synth Lo-Fi</span>
          </button>
        </div>
      </div>

      {/* Spotify-style Top Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in offline songs & playlist..."
          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tracks List */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {tracks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No tracks found. Click <span className="text-emerald-400 font-semibold">Scan Phone Music Folder</span> to load offline songs directly from your phone.
          </div>
        ) : (
          tracks
            .map((track, originalIdx) => ({ track, originalIdx }))
            .filter(({ track }) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                track.title.toLowerCase().includes(q) ||
                track.artist.toLowerCase().includes(q) ||
                track.album.toLowerCase().includes(q)
              );
            })
            .map(({ track, originalIdx }) => {
              const isActive = originalIdx === currentTrackIndex;
              const isVideoTrack = track.artist?.includes('Video') || track.title.endsWith('.mp4') || track.title.endsWith('.mkv');

              return (
                <div
                  key={track.id}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all group ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                      : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                  }`}
                >
                  <button
                    onClick={() => onSelectTrack(originalIdx)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    {/* Index / Playing icon */}
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : isVideoTrack ? (
                        <Video className="w-4 h-4 text-emerald-400" />
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

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
                        <span>{track.artist}</span>
                        {isVideoTrack && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                            Video MP3 Stream
                          </span>
                        )}
                      </p>
                    </div>
                  </button>

                <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-zinc-400">
                  {track.isCustom && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] hidden sm:inline">
                      Offline
                    </span>
                  )}
                  <span>{formatDuration(track.duration)}</span>

                  {onRemoveTrack && track.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove from offline list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

