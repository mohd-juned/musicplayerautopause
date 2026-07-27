import React from 'react';
import { X, Sliders, ShieldCheck, HelpCircle } from 'lucide-react';
import { VoiceDetectorSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceDetectorSettings;
  onSetSilenceDelay: (sec: number) => void;
  onSetUseSpeechFilter: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSetSilenceDelay,
  onSetUseSpeechFilter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold">Voice Detection Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Silence Resume Delay (Default 5s) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-zinc-200">
                Silence Resume Timer
              </label>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {settings.silenceDelaySeconds} Seconds
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              How long to wait after silence is detected before resuming music. (Default: 5s)
            </p>
            <input
              type="range"
              min={2}
              max={10}
              step={0.5}
              value={settings.silenceDelaySeconds}
              onChange={(e) => onSetSilenceDelay(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>2s</span>
              <span>5s (Default)</span>
              <span>10s</span>
            </div>
          </div>

          {/* Voice Bandpass Filter */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-white/5">
            <div>
              <h4 className="text-sm font-semibold text-white">Human Voice Bandpass Filter</h4>
              <p className="text-xs text-zinc-400">
                Isolates 300Hz–3400Hz frequencies to reduce music/bg noise false positives
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.useSpeechFilter}
                onChange={(e) => onSetUseSpeechFilter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* How Logic Works Explainer */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 text-zinc-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>How Auto Voice Pause Works</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed text-zinc-300">
              <li><strong>Real-time RMS Audio Stream:</strong> Continuously monitors mic volume in a non-blocking requestAnimationFrame loop.</li>
              <li><strong>Speech Trigger:</strong> Exceeding threshold immediately pauses music & updates status.</li>
              <li><strong>5s Silence Reset:</strong> Once voice drops below threshold, a 5.0 second countdown begins. Speech at any point resets timer back to 5.0s.</li>
              <li><strong>Auto-Resume:</strong> Music automatically resumes once 5.0 seconds of complete silence is reached.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
