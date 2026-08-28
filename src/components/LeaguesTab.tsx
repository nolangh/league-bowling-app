import React, { useState } from "react";
import { Users, Calendar, MapPin, Trophy, DollarSign, Check, Plus, Shield } from "lucide-react";
import type { League, UserProfile } from "../types";

interface LeaguesTabProps {
  leagues: League[];
  user: UserProfile;
  onJoinLeague: (id: string) => Promise<void>;
}

export const LeaguesTab: React.FC<LeaguesTabProps> = ({ leagues, user, onJoinLeague }) => {
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  const filteredLeagues = leagues.filter((l) => {
    if (levelFilter === "ALL") return true;
    return l.level === levelFilter;
  });

  return (
    <div id="leagues-tab-content" className="space-y-6">
      {/* Hero */}
      <div className="bg-[#1a1a16] text-white rounded-3xl p-5 sm:p-7 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#9fe870] text-black text-[10px] font-extrabold uppercase rounded tracking-wider">
                COMPETITIVE CIRCUITS
              </span>
              <span className="text-xs text-stone-400">Sanctioned & Scratch Bowling Leagues</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide uppercase text-white">
              DISCOVER LEAGUES
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1">
              Join local teams, compete for weekly prize pools, and track your season standings with automated USBC average handicapping.
            </p>
          </div>

          <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 flex items-center gap-4">
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase">JOINED LEAGUES</div>
              <div className="font-display text-2xl font-black text-[#9fe870]">
                {leagues.filter((l) => l.isJoined).length} Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <span className="text-xs font-bold text-stone-500 mr-2 shrink-0">Skill Tier:</span>
        {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              levelFilter === lvl
                ? "bg-[#141512] text-[#9fe870] shadow-sm"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLeagues.map((lg) => (
          <div
            key={lg.id}
            id={`league-card-${lg.id}`}
            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                        lg.level === "EXPERT"
                          ? "bg-purple-100 text-purple-800"
                          : lg.level === "ADVANCED"
                          ? "bg-amber-100 text-amber-800"
                          : lg.level === "INTERMEDIATE"
                          ? "bg-cyan-100 text-cyan-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {lg.level}
                    </span>
                    {lg.type === "private" && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 rounded-full">
                        Invite Only
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl font-extrabold text-stone-900 uppercase">
                    {lg.name}
                  </h3>
                </div>

                {lg.prizeFund && (
                  <div className="bg-emerald-50 text-[#166534] px-3 py-1.5 rounded-xl border border-emerald-200 text-right">
                    <div className="text-[9px] font-bold uppercase tracking-wider">PRIZE FUND</div>
                    <div className="font-display text-lg font-black leading-none">{lg.prizeFund}</div>
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mt-2 font-medium">
                {lg.description}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2.5 my-4 bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-xs text-stone-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>{lg.dayOfWeek || "Thursdays"} • {lg.time || "7:00 PM"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-stone-400" />
                  <span>{lg.members} Bowlers</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  <span>{lg.location || "Bowlero Midtown Lanes"}</span>
                </div>
              </div>

              {/* Weekly Challenge */}
              <div className="bg-[#141512] text-white p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#9fe870]" />
                  <span className="text-stone-300 font-medium">Weekly Bounty:</span>
                </div>
                <span className="font-extrabold text-[#9fe870]">{lg.weeklyChallenge}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Avg: {lg.avgScore} Pins</span>
              <button
                id={`join-league-btn-${lg.id}`}
                onClick={() => onJoinLeague(lg.id)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  lg.isJoined
                    ? "bg-stone-100 text-stone-800 hover:bg-rose-50 hover:text-rose-700 border border-stone-200"
                    : "bg-[#9fe870] hover:bg-[#8fd860] text-black"
                }`}
              >
                {lg.isJoined ? (
                  <>
                    <Check className="w-4 h-4 text-[#166534]" />
                    <span>Member (Leave)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Join League</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
