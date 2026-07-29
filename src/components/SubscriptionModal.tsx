import React, { useState } from 'react';
import { X, Crown, Sparkles, Check, Zap, ShieldCheck } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribeSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribeSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartTrial = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSubscribeSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white space-y-5 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20">
            <Crown className="w-8 h-8 fill-black" />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Unlock Earpro Pro
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Get Hands-Free AI Auto-Pause on Speech & High Precision Noise Filtering
          </p>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedPlan === 'monthly'
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
            }`}
          >
            <span className="text-xs font-bold block text-white">Monthly</span>
            <span className="text-lg font-black text-emerald-400 font-mono">₹49</span>
            <span className="text-[10px] text-zinc-400 block">/ month</span>
          </button>

          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedPlan === 'yearly'
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
            }`}
          >
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-black">
              SAVE 32%
            </span>
            <span className="text-xs font-bold block text-white">Yearly</span>
            <span className="text-lg font-black text-emerald-400 font-mono">₹399</span>
            <span className="text-[10px] text-zinc-400 block">/ year</span>
          </button>
        </div>

        {/* Features List */}
        <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 text-xs">
          <div className="flex items-center gap-2 text-zinc-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Smart Auto-Pause:</strong> Song pauses instantly when you speak</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>High Noise Suppression:</strong> Prevents distant voice false triggers</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Offline Direct Scan:</strong> Unlimited local MP3/MP4 media streaming</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cancel anytime in Google Play Store or App Settings</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStartTrial}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <span>Activating Premium Subscription...</span>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-black" />
              <span>Start 7-Day Free Trial</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secured by Google Play Billing / Stripe In-App Subscription</span>
        </p>
      </div>
    </div>
  );
};
