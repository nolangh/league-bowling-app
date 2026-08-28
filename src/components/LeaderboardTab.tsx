import React, { useState } from "react";
import { Trophy, Medal, Search, Zap, Shield, Users } from "lucide-react";
import type { UserProfile } from "../types";
import { RankBadge } from "./RankBadge";

interface LeaderboardTabProps {
  user: UserProfile;
  leaderboardData: UserProfile[];
  onOpenChallengeModalWithUser?: (username: string, avg: number) => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  user,
  leaderboardData,
  onOpenChallengeModalWithUser,
}) => {
  const [filter, setFilter] = useState<"global" | "friends" | "team">("global");
  const [search, setSearch] = useState("");

  const filteredList = leaderboardData.filter((u) => {
    if (filter === "team" && u.team !== user.team) return false;
    if (!search) return true;
    return (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.rank.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div id="leaderboard-tab-content" className="space-y-6">
      {/* Top Standings Banner */}
      <div className="bg-[#1a1a16] text-white rounded-3xl p-5 sm:p-7 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#9fe870] text-black text-[10px] font-extrabold uppercase rounded tracking-wider">
                BSR RANKINGS
              </span>
              <span className="text-xs text-stone-400">Official Bowler Skill Rating</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide uppercase text-white">
              LEAGUE STANDINGS
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1">
              Bowler Skill Rating (BSR) scales with verified match outcomes, tournament performances, and career averages.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-900/90 p-3 rounded-2xl border border-stone-800">
            <div className="text-center px-2">
              <div className="text-[10px] font-bold text-stone-400 uppercase">YOUR RANK</div>
              <div className="font-display text-2xl font-black text-[#9fe870]">#4</div>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div className="text-center px-2">
              <div className="text-[10px] font-bold text-stone-400 uppercase">YOUR BSR</div>
              <div className="font-display text-2xl font-black text-white">{user.rating}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            id="leaderboard-filter-global"
            onClick={() => setFilter("global")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === "global"
                ? "bg-[#141512] text-[#9fe870] font-extrabold shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Global ({leaderboardData.length})
          </button>
          <button
            id="leaderboard-filter-friends"
            onClick={() => setFilter("friends")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === "friends"
                ? "bg-[#141512] text-[#9fe870] font-extrabold shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Friends
          </button>
          <button
            id="leaderboard-filter-team"
            onClick={() => setFilter("team")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === "team"
                ? "bg-[#141512] text-[#9fe870] font-extrabold shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Team ({user.team})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bowler..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870] w-full sm:w-60"
          />
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          {filteredList.map((player, index) => {
            const isMe = player.id === user.id;
            return (
              <div
                key={player.id}
                id={`leaderboard-row-${player.id}`}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isMe ? "bg-[#9fe870]/10 border-l-4 border-l-[#9fe870]" : "hover:bg-stone-50/80"
                }`}
              >
                {/* Bowler Details */}
                <div className="flex items-center gap-3.5">
                  {/* Position Badge */}
                  <div className="w-8 flex items-center justify-center font-display text-xl font-black shrink-0">
                    {index === 0 ? (
                      <span className="text-amber-500 flex items-center gap-0.5">🥇 #1</span>
                    ) : index === 1 ? (
                      <span className="text-slate-400 flex items-center gap-0.5">🥈 #2</span>
                    ) : index === 2 ? (
                      <span className="text-amber-700 flex items-center gap-0.5">🥉 #3</span>
                    ) : (
                      <span className="text-stone-400">#{index + 1}</span>
                    )}
                  </div>

                  <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                    {player.username.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-stone-900">@{player.username}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black bg-[#141512] text-[#9fe870] rounded">
                          YOU
                        </span>
                      )}
                      {player.isPro && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black bg-[#9fe870] text-black rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <RankBadge rank={player.rank} size="sm" />
                      <span className="text-xs text-stone-500 font-medium">{player.name}</span>
                      <span className="text-[11px] text-stone-400">• Team: {player.team}</span>
                    </div>
                  </div>
                </div>

                {/* Bowler Metrics */}
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-11 sm:pl-0">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-400 uppercase">CAREER AVG</div>
                    <div className="text-base font-extrabold text-stone-900">{player.careerAvg}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-400 uppercase">HIGH GAME</div>
                    <div className="text-base font-extrabold text-stone-900">{player.highGame}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-400 uppercase">BSR SCORE</div>
                    <div className="font-display text-2xl font-black text-[#166534] leading-none">
                      {player.rating}
                    </div>
                  </div>

                  {!isMe && onOpenChallengeModalWithUser && (
                    <button
                      onClick={() => onOpenChallengeModalWithUser(player.username, player.careerAvg)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-black text-[#9fe870] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Send challenge"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Challenge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
