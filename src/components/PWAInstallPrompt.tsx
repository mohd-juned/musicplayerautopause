import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { BeforeInstallPromptEvent } from './Header';

interface PWAInstallPromptProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstall: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  deferredPrompt,
  onInstall,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-[#181818] border border-emerald-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Install Smart Player App</h4>
          <p className="text-[11px] text-zinc-400">
            Add to home screen for offline playback & background audio
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
