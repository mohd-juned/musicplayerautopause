import React from 'react';
import { Smartphone, Share, PlusSquare, MoreVertical, X, CheckCircle, Download } from 'lucide-react';
import appLogoUrl from '../assets/images/music_app_icon_1785345989179.jpg';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall,
}) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
              <img src={appLogoUrl} alt="Earpro App Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add to Home Screen</h3>
              <p className="text-xs text-zinc-400">Install Earpro PWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct One-Click Install if supported */}
        {canNativeInstall && onNativeInstall && (
          <button
            onClick={() => {
              onNativeInstall();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Install App Automatically</span>
          </button>
        )}

        {/* Step by step platform guide */}
        <div className="space-y-4 pt-2">
          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                iOS Safari Instructions
              </span>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 1</p>
                  <p className="text-zinc-400">
                    Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 2</p>
                  <p className="text-zinc-400">
                    Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Instructions */
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Android / Chrome Instructions
              </span>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 1</p>
                  <p className="text-zinc-400">
                    Tap the <strong>Three Dots Menu</strong> at the top-right of Chrome.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 2</p>
                  <p className="text-zinc-400">
                    Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits list */}
        <div className="pt-2 border-t border-white/10 text-xs space-y-1.5 text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Full-screen experience without browser URL bars</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Offline playback support & quick home icon access</span>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
