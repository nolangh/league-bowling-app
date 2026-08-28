import React, { useState } from "react";
import { Sparkles, Check, ShieldCheck, Zap, Award, Target, Trophy } from "lucide-react";
import type { UserProfile } from "../types";

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpgrade: () => Promise<void>;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgrade,
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await onUpgrade();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141512] text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-black bg-[#9fe870] text-black rounded-md tracking-widest uppercase">
              LEAGUE PRO
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            ELEVATE YOUR GAME
          </h2>
          <p className="text-xs text-stone-300 max-w-sm mx-auto">
            Unlock advanced ball track telemetry, AI score verification, zero match rake fees, and pro leaderboard badges.
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-xs">
          {[
            "0% Match Rake on High-Stakes Score Challenges ($50+)",
            "AI Camera Scorecard OCR Verification with Pinfall Telemetry",
            "Full Arsenal Transition Analytics & Oil Breakdown Heatmaps",
            "Verified Gold Pro Badge on Leaderboard and Moments Feed",
            "Unlimited Ball Storage in Locker & Custom Drill Specs",
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2.5 text-stone-200">
              <div className="w-5 h-5 rounded-full bg-[#9fe870]/20 text-[#9fe870] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              plan === "monthly"
                ? "bg-[#9fe870]/10 border-[#9fe870] text-white"
                : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700"
            }`}
          >
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Monthly</div>
            <div className="font-display text-2xl font-black text-white">$4.99<span className="text-xs text-stone-400">/mo</span></div>
            <div className="text-[10px] text-stone-400">Cancel anytime</div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
              plan === "yearly"
                ? "bg-[#9fe870]/10 border-[#9fe870] text-white"
                : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700"
            }`}
          >
            <span className="absolute -top-2 right-2 px-1.5 py-0.2 text-[9px] font-black bg-[#9fe870] text-black rounded uppercase">
              SAVE 35%
            </span>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9fe870]">Annual Pro</div>
            <div className="font-display text-2xl font-black text-white">$3.25<span className="text-xs text-stone-400">/mo</span></div>
            <div className="text-[10px] text-stone-400">$39 billed annually</div>
          </button>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            id="confirm-pro-upgrade-btn"
            disabled={loading || user.isPro}
            onClick={handleUpgrade}
            className="w-full py-3.5 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer"
          >
            {user.isPro
              ? "You Are Already a Pro Member"
              : loading
              ? "Activating Pro..."
              : `Upgrade to League Pro (${plan === "yearly" ? "$39/year" : "$4.99/mo"})`}
          </button>
        </div>
      </div>
    </div>
  );
};
