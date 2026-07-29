import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { VoiceState, VoiceDetectorSettings, VoiceDetectorStats } from '../types';

interface VoiceDetectorPanelProps {
  settings: VoiceDetectorSettings;
  voiceState: VoiceState;
  stats: VoiceDetectorStats;
  errorMessage: string | null;
  onToggleEnabled: () => void;
  onSetThresholdDb: (db: number) => void;
  onAutoCalibrate: () => void;
}

export const VoiceDetectorPanel: React.FC<VoiceDetectorPanelProps> = ({
  settings,
  voiceState,
  stats,
  errorMessage,
  onToggleEnabled,
  onSetThresholdDb,
  onAutoCalibrate,
}) => {
  // Format threshold display
  const thresholdPct = stats.thresholdVolume;
  const currentVolPct = stats.normalizedVolume;

  // Render Status Badge text & styling
  const getStatusBadge = () => {
    switch (voiceState) {
      case 'speaking':
        return {
          label: 'Voice Detected — Music Paused',
          bgColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: 'bg-amber-400 animate-ping',
        };
      case 'countdown':
        return {
          label: `Silence Detected — Resuming in ${stats.countdownRemaining.toFixed(1)}s`,
          bgColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dotColor: 'bg-cyan-400 animate-pulse',
        };
      case 'listening':
        return {
          label: 'Status: Listening for voice...',
          bgColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400 animate-pulse',
        };
      case 'requesting':
        return {
          label: 'Requesting Mic Access...',
          bgColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: 'bg-blue-400 animate-bounce',
        };
      case 'error':
        return {
          label: 'Mic Permission Error',
          bgColor: 'bg-red-500/20 text-red-300 border-red-500/40',
          dotColor: 'bg-red-500',
        };
      default:
        return {
          label: 'Auto Voice Pause Disabled',
          bgColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          dotColor: 'bg-zinc-500',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Toggle Header & Status */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              settings.enabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {settings.enabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Auto Voice Pause
              <span className="text-[10px] text-zinc-400 font-normal">Web Audio API</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Pauses song when speaking, resumes after 5s silence
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer self-start xs:self-center">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={onToggleEnabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {/* Error Message & Permission Request Card */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0 flex-1">
              <span className="font-bold text-red-300 block">Microphone Access Needed</span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onToggleEnabled}
              className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-black font-extrabold text-[11px] flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Permission</span>
            </button>

            <span className="text-[10px] text-zinc-400">
              Check browser address bar (🔒 icon) or Phone App Settings
            </span>
          </div>
        </div>
      )}

      {/* Active Voice Status Badge */}
      <div
        className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${statusInfo.bgColor}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
          <span>{statusInfo.label}</span>
        </div>

        {/* Countdown visual circle or numerical badge when active */}
        {voiceState === 'countdown' && (
          <div className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-200 font-mono text-[11px] font-bold border border-cyan-500/50">
            {stats.countdownRemaining.toFixed(1)}s
          </div>
        )}
      </div>

      {/* Live Mic Meter & Sensitivity Threshold */}
      {settings.enabled && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {/* Real-time Volume Bar vs Threshold Marker */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Mic Level: <span className="text-white font-mono">{stats.currentDb} dB</span>
              </span>
              <span className="text-zinc-400">
                Trigger Threshold: <span className="text-emerald-400 font-mono">{settings.thresholdDb} dB</span>
              </span>
            </div>

            {/* Level Bar Container */}
            <div className="relative w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
              {/* Mic Volume Fill */}
              <div
                className={`h-full transition-all duration-75 ${
                  stats.isSpeaking
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${currentVolPct}%` }}
              />

              {/* Threshold Marker Indicator Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)] z-10"
                style={{ left: `${thresholdPct}%` }}
                title={`Threshold Marker: ${settings.thresholdDb} dB`}
              >
                <div className="w-2 h-2 bg-red-400 rounded-full -translate-x-1/2 -translate-y-1/4" />
              </div>
            </div>
          </div>

          {/* Automatic Noise Filter & Calibration Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Auto High-Precision Voice Threshold</span>
                <span className="text-[11px] text-zinc-400">Fixed at -22 dB to block ambient chatter & distant voices</span>
              </div>
            </div>

            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
              OPTIMIZED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
