import React from "react";
import type { Rank } from "../types";

export const RANK_COLORS: Record<Rank, { bg: string; text: string; border: string }> = {
  Rookie: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300" },
  Amateur: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300" },
  Intermediate: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
  Advanced: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-400" },
  Expert: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-400" },
  Elite: { bg: "bg-amber-200", text: "text-amber-900", border: "border-amber-500" },
  "Diamond IV": { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-400" },
  "Diamond III": { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-400" },
  "Diamond II": { bg: "bg-cyan-200", text: "text-cyan-900", border: "border-cyan-500" },
  "Diamond I": { bg: "bg-cyan-200", text: "text-cyan-900", border: "border-cyan-500" },
  "Platinum II": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  "Platinum I": { bg: "bg-purple-200", text: "text-purple-900", border: "border-purple-400" },
  Legend: { bg: "bg-[#9fe870]/20", text: "text-[#1a4409]", border: "border-[#9fe870]" },
  Kingpin: { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-400" },
};

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg";
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = "md" }) => {
  const styling = RANK_COLORS[rank] || RANK_COLORS.Legend;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  return (
    <span
      id={`rank-badge-${rank.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${styling.bg} ${styling.text} ${styling.border} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {rank}
    </span>
  );
};
