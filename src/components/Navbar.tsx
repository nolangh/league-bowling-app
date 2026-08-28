import React from "react";
import { Zap, MessageSquare, Award, Users, Trophy, Shield, Sparkles, PlusCircle } from "lucide-react";
import type { UserProfile } from "../types";
import { RankBadge } from "./RankBadge";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onOpenLogModal: () => void;
  onOpenChallengeModal: () => void;
  onOpenProModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenLogModal,
  onOpenChallengeModal,
  onOpenProModal,
}) => {
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));

  const navItems = [
    { id: "challenges", label: "Challenges", icon: Zap },
    { id: "moments", label: "Moments", icon: MessageSquare },
    { id: "log", label: "Score Log", icon: Award },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "leagues", label: "Leagues", icon: Users },
    { id: "arsenal", label: "Arsenal", icon: Shield },
    { id: "profile", label: "Profile", icon: Users },
  ];

  return (
    <header id="app-navbar" className="sticky top-0 z-40 bg-[#141512] text-white border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9fe870] flex items-center justify-center text-black font-extrabold text-lg shadow-sm">
              🎳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl tracking-wider font-extrabold text-white leading-none">
                  LEAGUE
                </span>
                {user.isPro ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#9fe870] text-black rounded tracking-widest uppercase">
                    PRO
                  </span>
                ) : (
                  <button
                    id="nav-upgrade-pro-btn"
                    onClick={onOpenProModal}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded hover:bg-amber-400/30 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    UPGRADE
                  </button>
                )}
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Premium Bowling Matchmaking & Stats
              </p>
            </div>
          </div>

          {/* User Quick Stats Header */}
          <div className="hidden lg:flex items-center gap-4 bg-stone-900/80 px-3.5 py-1.5 rounded-xl border border-stone-800">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <span className="text-[11px] text-stone-400">@{user.username}</span>
                <RankBadge rank={user.rank} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-[#9fe870]">LVL {user.level}</span>
                <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#9fe870] rounded-full transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400">
                  {user.xp}/{user.xpToNext} XP
                </span>
              </div>
            </div>
            <div className="h-7 w-px bg-stone-800" />
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">BSR RATING</div>
              <div className="text-base font-extrabold text-[#9fe870] leading-none">{user.rating}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">AVG</div>
              <div className="text-base font-extrabold text-white leading-none">{user.careerAvg}</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="nav-quick-log-btn"
              onClick={onOpenLogModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl text-xs font-bold transition-all border border-stone-700 cursor-pointer shadow-sm"
            >
              <Award className="w-4 h-4 text-[#9fe870]" />
              <span className="hidden sm:inline">Log Game</span>
            </button>
            <button
              id="nav-quick-challenge-btn"
              onClick={onOpenChallengeModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9fe870] hover:bg-[#8fd860] text-black rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Post Match</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none border-t border-stone-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#9fe870] text-black shadow-sm font-extrabold"
                    : "text-stone-300 hover:text-white hover:bg-stone-800/70"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-stone-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
