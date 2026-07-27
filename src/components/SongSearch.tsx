import React, { useState } from 'react';
import { Search, Play, Plus, Check, Music, Sparkles, Loader2, Radio } from 'lucide-react';
import { Track } from '../types';
import { searchOnlineTracks } from '../services/musicApi';

interface SongSearchProps {
  currentTrack: Track;
  isPlaying: boolean;
  onSelectOnlineTrack: (track: Track) => void;
  onAddTrackToQueue: (track: Track) => void;
  addedTrackIds: Set<string>;
}

export const SongSearch: React.FC<SongSearchProps> = ({
  currentTrack,
  isPlaying,
  onSelectOnlineTrack,
  onAddTrackToQueue,
  addedTrackIds,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Popular search suggestions
  const popularSearches = [
    'Arijit Singh',
    'Taylor Swift',
    'Coldplay',
    'Ed Sheeran',
    'Lo-fi Beats',
    'Weeknd',
    'Dua Lipa',
    'BTS',
  ];

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    const tracks = await searchOnlineTracks(q);
    setResults(tracks);
    setIsSearching(false);
  };

  return (
    <div className="bg-[#181818] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-xl mx-auto w-full space-y-5">
      {/* Search Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Search Online Songs</h2>
          <p className="text-xs text-zinc-400">Stream millions of track previews instantly</p>
        </div>
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Quick Suggestions Pills */}
      <div>
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Trending Artists
        </span>
        <div className="flex flex-wrap gap-1.5">
          {popularSearches.map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}
              className="px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 hover:text-emerald-400 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar pt-2">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs">Searching online library...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((track) => {
            const isCurrentPlaying = currentTrack.id === track.id;
            const isAdded = addedTrackIds.has(track.id);

            return (
              <div
                key={track.id}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all border ${
                  isCurrentPlaying
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-900'
                }`}
              >
                {/* Artwork & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden shrink-0 relative">
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                    {isCurrentPlaying && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isCurrentPlaying ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      {track.artist} • {track.album}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectOnlineTrack(track)}
                    className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                    title="Play Now"
                  >
                    <Play className="w-4 h-4 fill-black translate-x-0.5" />
                  </button>

                  <button
                    onClick={() => onAddTrackToQueue(track)}
                    className={`p-2.5 rounded-full border transition-colors ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border-white/10'
                    }`}
                    title={isAdded ? 'Added to Playlist' : 'Add to Playlist Queue'}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        ) : hasSearched ? (
          <div className="text-center py-12 text-zinc-500 space-y-2">
            <Music className="w-10 h-10 mx-auto text-zinc-600" />
            <p className="text-xs">No online songs found for "{query}".</p>
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-500/50" />
            <p className="text-xs">Search for any song or artist above to start listening!</p>
          </div>
        )}
      </div>
    </div>
  );
};
