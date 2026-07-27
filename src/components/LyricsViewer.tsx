import React, { useState, useEffect, useRef } from 'react';
import { Music, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Track } from '../types';
import { fetchTrackLyrics, LyricsData } from '../services/musicApi';

interface LyricsViewerProps {
  currentTrack: Track;
  currentTime: number;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ currentTrack, currentTime }) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLyricsData(null);

    fetchTrackLyrics(currentTrack.title, currentTrack.artist)
      .then((data) => {
        if (isMounted) {
          setLyricsData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentTrack.title, currentTrack.artist]);

  // Find current active synced lyric line
  const activeIndex = React.useMemo(() => {
    if (!lyricsData?.syncedLyrics) return -1;
    const synced = lyricsData.syncedLyrics;
    for (let i = synced.length - 1; i >= 0; i--) {
      if (currentTime >= synced[i].time) {
        return i;
      }
    }
    return 0;
  }, [lyricsData, currentTime]);

  // Smooth auto-scroll active lyric line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="bg-[#181818] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-xl mx-auto w-full flex flex-col min-h-[420px]">
      {/* Track Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
          <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white truncate">{currentTrack.title}</h3>
          <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
        </div>
        {lyricsData?.syncedLyrics && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Synced Lyrics
          </span>
        )}
      </div>

      {/* Lyrics Display Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[360px] pr-2 space-y-4 custom-scrollbar text-center py-4"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3 text-zinc-400">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
            <p className="text-xs">Searching lyrics for "{currentTrack.title}"...</p>
          </div>
        ) : lyricsData?.syncedLyrics && lyricsData.syncedLyrics.length > 0 ? (
          // Synced Karaoke-style lyrics
          lyricsData.syncedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                className={`transition-all duration-300 px-3 py-1.5 rounded-xl cursor-default ${
                  isActive
                    ? 'text-emerald-400 text-lg sm:text-xl font-bold scale-105 bg-emerald-500/10 border border-emerald-500/20 shadow-lg'
                    : 'text-zinc-500 text-sm font-medium hover:text-zinc-300'
                }`}
              >
                {line.text}
              </div>
            );
          })
        ) : lyricsData?.plainLyrics ? (
          // Plain Text Lyrics
          <div className="whitespace-pre-line text-zinc-300 text-sm leading-relaxed font-medium px-2">
            {lyricsData.plainLyrics}
          </div>
        ) : (
          // Fallback when no lyrics found
          <div className="flex flex-col items-center justify-center h-48 space-y-3 text-zinc-500">
            <Music className="w-10 h-10 text-zinc-600" />
            <p className="text-xs">No lyrics found for this track.</p>
            <p className="text-[11px] text-zinc-600 max-w-xs text-center">
              Try searching and playing popular online songs from the Search tab for full synced lyrics!
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-500">
        <span>Lyrics provided by {lyricsData?.provider || 'LRCLIB API'}</span>
        <span className="font-mono">{currentTrack.duration ? `${Math.floor(currentTime)}s` : ''}</span>
      </div>
    </div>
  );
};
