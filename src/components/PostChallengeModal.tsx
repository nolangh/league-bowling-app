import React, { useState } from "react";
import { Zap, DollarSign, Target, Award } from "lucide-react";
import type { UserProfile } from "../types";

interface PostChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialTargetScore?: number;
  initialOpponent?: string;
  onPost: (score: number, stake: number, notes: string) => Promise<void>;
}

export const PostChallengeModal: React.FC<PostChallengeModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTargetScore,
  initialOpponent,
  onPost,
}) => {
  const [score, setScore] = useState(initialTargetScore ? String(initialTargetScore) : "250");
  const [stake, setStake] = useState<number>(25);
  const [notes, setNotes] = useState(initialOpponent ? `Challenge to @${initialOpponent}` : "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseInt(score);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 300) return;

    setSubmitting(true);
    try {
      await onPost(scoreVal, stake, notes.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const stakeOptions = [10, 25, 50, 75, 100];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider">
              HEAD-TO-HEAD MATCHMAKING
            </span>
            <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
              POST SCORE CHALLENGE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1">
              Target Score to Beat (0 - 300)
            </label>
            <input
              id="challenge-score-input"
              type="number"
              min="0"
              max="300"
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full text-center font-display text-4xl font-extrabold bg-stone-50 border border-stone-300 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-700 mb-2">
              Select Stake Amount
            </label>
            <div className="grid grid-cols-5 gap-2">
              {stakeOptions.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStake(st)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    stake === st
                      ? "bg-stone-900 text-[#9fe870] shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  ${st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1">
              Match Note / Pattern Info
            </label>
            <input
              type="text"
              placeholder="e.g. Rolled on Viper pattern with Storm Phaze II"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
            />
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <div className="flex justify-between">
              <span>Your BSR Rating:</span>
              <strong className="text-black">{user.rating}</strong>
            </div>
            <div className="flex justify-between">
              <span>Match Type:</span>
              <strong className="text-black">1-Game Scratch Match</strong>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-post-challenge-btn"
              type="submit"
              disabled={submitting || !score}
              className="px-5 py-2.5 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {submitting ? "Posting..." : "Post Open Match"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
