import React, { useState } from "react";
import { Zap, Plus, CheckCircle, Clock, DollarSign, Target, Award, Trash2 } from "lucide-react";
import type { Challenge, UserProfile } from "../types";
import { RankBadge } from "./RankBadge";

interface ChallengesTabProps {
  challenges: Challenge[];
  myChallenges: Challenge[];
  user: UserProfile;
  onPostChallenge: (score: number, stake: number, notes: string) => Promise<void>;
  onAcceptChallenge: (id: string) => Promise<void>;
  onCompleteChallenge: (id: string, score: number) => Promise<{ result: "won" | "lost"; bsrChange: number } | null>;
  onDeleteChallenge: (id: string) => Promise<void>;
  onOpenPostModal: () => void;
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({
  challenges,
  myChallenges,
  user,
  onPostChallenge,
  onAcceptChallenge,
  onCompleteChallenge,
  onDeleteChallenge,
  onOpenPostModal,
}) => {
  const [subTab, setSubTab] = useState<"open" | "my" | "active" | "history">("open");
  const [stakeFilter, setStakeFilter] = useState<number | "all">("all");
  const [activeMatchModal, setActiveMatchModal] = useState<Challenge | null>(null);
  const [matchScoreInput, setMatchScoreInput] = useState("");
  const [matchResult, setMatchResult] = useState<{ result: "won" | "lost"; bsrChange: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered lists
  const openList = challenges.filter((c) => {
    if (c.status !== "open") return false;
    if (stakeFilter === "all") return true;
    return c.stake === stakeFilter;
  });

  const activeMatches = [...challenges, ...myChallenges].filter((c) => c.status === "active");
  const completedMatches = [...challenges, ...myChallenges].filter((c) => c.status === "completed");

  const handleResolveMatch = async () => {
    if (!activeMatchModal) return;
    const score = Number(matchScoreInput);
    if (isNaN(score) || score < 0 || score > 300) return;

    setIsSubmitting(true);
    try {
      const outcome = await onCompleteChallenge(activeMatchModal.id, score);
      if (outcome) {
        setMatchResult(outcome);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="challenges-tab-content" className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-[#1a1a16] text-white rounded-2xl p-5 sm:p-7 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#9fe870]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-[#9fe870] text-black text-[11px] font-extrabold uppercase rounded tracking-wider">
                SKILL MATCHES
              </span>
              <span className="text-xs text-stone-400">Head-to-head Bowling Stakes</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide uppercase text-white">
              BOWLING CHALLENGES
            </h1>
            <p className="text-sm text-stone-300 max-w-xl mt-1">
              Test your skills against verified bowlers. Match their target score to win stakes, climb the BSR rankings, and earn XP.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="post-challenge-cta-btn"
              onClick={onOpenPostModal}
              className="px-4 py-2.5 bg-[#9fe870] hover:bg-[#8fd860] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Subtabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            id="subtab-open"
            onClick={() => setSubTab("open")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              subTab === "open"
                ? "bg-[#141512] text-[#9fe870] shadow-sm"
                : "text-stone-600 hover:text-black hover:bg-stone-100"
            }`}
          >
            Open Matches ({openList.length})
          </button>
          <button
            id="subtab-my"
            onClick={() => setSubTab("my")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              subTab === "my"
                ? "bg-[#141512] text-[#9fe870] shadow-sm"
                : "text-stone-600 hover:text-black hover:bg-stone-100"
            }`}
          >
            My Posts ({myChallenges.length})
          </button>
          <button
            id="subtab-active"
            onClick={() => setSubTab("active")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              subTab === "active"
                ? "bg-[#141512] text-[#9fe870] shadow-sm"
                : "text-stone-600 hover:text-black hover:bg-stone-100"
            }`}
          >
            Active ({activeMatches.length})
          </button>
          <button
            id="subtab-history"
            onClick={() => setSubTab("history")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              subTab === "history"
                ? "bg-[#141512] text-[#9fe870] shadow-sm"
                : "text-stone-600 hover:text-black hover:bg-stone-100"
            }`}
          >
            History ({completedMatches.length})
          </button>
        </div>

        {/* Stake Filter */}
        {subTab === "open" && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-xs font-bold text-stone-500 mr-1">Stake:</span>
            {[
              { label: "All", val: "all" },
              { label: "$10", val: 10 },
              { label: "$25", val: 25 },
              { label: "$50", val: 50 },
              { label: "$75+", val: 75 },
            ].map((st) => (
              <button
                key={String(st.val)}
                onClick={() => setStakeFilter(st.val as any)}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  stakeFilter === st.val
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Grid */}
      {subTab === "open" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openList.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200 p-8">
              <Zap className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-600">No open challenges for this stake</p>
              <p className="text-xs text-stone-400 mt-1">Be the first to post a new score challenge!</p>
              <button
                onClick={onOpenPostModal}
                className="mt-4 px-4 py-2 bg-[#9fe870] text-black text-xs font-extrabold rounded-xl"
              >
                Post Challenge
              </button>
            </div>
          ) : (
            openList.map((ch) => (
              <div
                key={ch.id}
                id={`challenge-card-${ch.id}`}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bowler Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm"
                        style={{ backgroundColor: ch.avatarColor || "#2a3a5c" }}
                      >
                        {ch.initials || ch.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-stone-900">@{ch.username}</span>
                          {ch.isPro && (
                            <span className="px-1 py-0.2 text-[9px] font-black bg-[#9fe870] text-black rounded">
                              PRO
                            </span>
                          )}
                        </div>
                        <RankBadge rank={ch.rank} size="sm" />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end text-[#166534] font-black text-sm bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{ch.stake} Stake</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Score block */}
                  <div className="bg-[#141512] text-white p-3.5 rounded-xl flex items-center justify-between my-3">
                    <div>
                      <div className="text-[10px] font-extrabold text-[#9fe870] uppercase tracking-wider">
                        TARGET SCORE TO BEAT
                      </div>
                      <div className="text-xs text-stone-400">Single Game Scratch Match</div>
                    </div>
                    <div className="font-display text-4xl font-extrabold text-white leading-none">
                      {ch.postedScore}
                    </div>
                  </div>

                  {ch.notes && (
                    <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 italic mb-4">
                      "{ch.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Open match</span>
                  </div>
                  <button
                    id={`accept-challenge-btn-${ch.id}`}
                    onClick={() => {
                      onAcceptChallenge(ch.id);
                      setActiveMatchModal(ch);
                      setMatchScoreInput("");
                      setMatchResult(null);
                    }}
                    className="px-4 py-2 bg-[#9fe870] hover:bg-[#8fd860] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Accept Match
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Posts Tab */}
      {subTab === "my" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myChallenges.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200 p-8">
              <Zap className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-600">You haven't posted any challenges</p>
              <button
                onClick={onOpenPostModal}
                className="mt-4 px-4 py-2 bg-[#9fe870] text-black text-xs font-extrabold rounded-xl"
              >
                Post Your Score
              </button>
            </div>
          ) : (
            myChallenges.map((ch) => (
              <div
                key={ch.id}
                id={`my-challenge-${ch.id}`}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#141512] text-[#9fe870] rounded-full uppercase">
                        {ch.status}
                      </span>
                      <span className="text-xs font-bold text-stone-500">${ch.stake} Stake</span>
                    </div>
                    <button
                      onClick={() => onDeleteChallenge(ch.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Cancel challenge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#141512] text-white p-3.5 rounded-xl flex items-center justify-between my-2">
                    <div>
                      <div className="text-[10px] font-extrabold text-[#9fe870] uppercase">YOUR POSTED SCORE</div>
                      <div className="text-xs text-stone-400">Waiting for opponents</div>
                    </div>
                    <div className="font-display text-4xl font-extrabold text-white leading-none">
                      {ch.postedScore}
                    </div>
                  </div>

                  {ch.notes && <p className="text-xs text-stone-600 mt-2 italic">"{ch.notes}"</p>}
                </div>

                <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span>Created {new Date(ch.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-stone-700">Open for challengers</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Active Matches Tab */}
      {subTab === "active" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMatches.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200 p-8">
              <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-600">No active matches in progress</p>
              <p className="text-xs text-stone-400 mt-1">Accept an open challenge or wait for someone to accept yours.</p>
            </div>
          ) : (
            activeMatches.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl p-5 border-2 border-[#9fe870] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#9fe870] text-black rounded-full uppercase">
                      IN PROGRESS
                    </span>
                    <span className="text-xs font-extrabold text-stone-900">${ch.stake} STAKE</span>
                  </div>

                  <p className="text-xs text-stone-700 font-bold mt-2">
                    Match against <span className="text-black font-extrabold">@{ch.username}</span>
                  </p>
                  <p className="text-xs text-stone-500">Target score: {ch.postedScore}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setActiveMatchModal(ch);
                      setMatchScoreInput("");
                      setMatchResult(null);
                    }}
                    className="w-full py-2.5 bg-[#141512] text-[#9fe870] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    Submit Match Score
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {subTab === "history" && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm overflow-hidden">
          <h3 className="font-display text-xl font-bold text-stone-900 uppercase mb-3">
            COMPLETED MATCH HISTORY
          </h3>
          {completedMatches.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No completed match history yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {completedMatches.map((ch) => {
                const won = ch.winnerUserId === user.id;
                return (
                  <div key={ch.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          won ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {won ? "W" : "L"}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-stone-900">
                          vs @{ch.username} (${ch.stake} Match)
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Target: {ch.postedScore} | Submitted: {ch.acceptedScore || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-extrabold uppercase ${
                          won ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {won ? `+${Math.round(15 + ch.stake * 0.4)} BSR` : `-${Math.round(10 + ch.stake * 0.2)} BSR`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Enter Match Result */}
      {activeMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in duration-200">
            {!matchResult ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#9fe870] text-black rounded-full uppercase">
                      MATCH RESOLUTION
                    </span>
                    <h3 className="font-display text-2xl font-black text-stone-900 uppercase mt-1">
                      SUBMIT YOUR SCORE
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMatchModal(null)}
                    className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 mb-4">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Opponent: <strong className="text-black">@{activeMatchModal.username}</strong></span>
                    <span>Stake: <strong className="text-emerald-700">${activeMatchModal.stake}</strong></span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">Target to beat:</span>
                    <span className="text-xl font-display font-extrabold text-stone-900">
                      {activeMatchModal.postedScore}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-extrabold uppercase text-stone-700">
                    Your Verified Game Score (0 - 300)
                  </label>
                  <input
                    id="match-score-input"
                    type="number"
                    min="0"
                    max="300"
                    placeholder="e.g. 278"
                    value={matchScoreInput}
                    onChange={(e) => setMatchScoreInput(e.target.value)}
                    className="w-full text-center font-display text-4xl font-extrabold bg-stone-100 border border-stone-300 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-black"
                  />
                  <p className="text-[11px] text-stone-400 text-center">
                    Higher score wins the match stake and gains BSR ranking points.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setActiveMatchModal(null)}
                    className="flex-1 py-3 text-xs font-bold bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-submit-match-btn"
                    disabled={!matchScoreInput || isSubmitting}
                    onClick={handleResolveMatch}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-wider bg-[#9fe870] text-black rounded-xl hover:bg-[#8fd860] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? "Calculating..." : "Confirm & Resolve"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-3xl ${
                    matchResult.result === "won" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {matchResult.result === "won" ? "🏆" : "🎳"}
                </div>
                <h3 className="font-display text-3xl font-extrabold text-stone-900 uppercase">
                  {matchResult.result === "won" ? "MATCH VICTORY!" : "MATCH DEFEAT"}
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  {matchResult.result === "won"
                    ? `You outbowled @${activeMatchModal.username} and collected the $${activeMatchModal.stake} prize!`
                    : `Tough roll! @${activeMatchModal.username} held the lead.`}
                </p>

                <div className="my-5 bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-around">
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase">BSR CHANGE</div>
                    <div
                      className={`text-2xl font-display font-extrabold ${
                        matchResult.result === "won" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {matchResult.bsrChange > 0 ? `+${matchResult.bsrChange}` : matchResult.bsrChange}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-stone-200" />
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase">XP EARNED</div>
                    <div className="text-2xl font-display font-extrabold text-[#166534]">
                      {matchResult.result === "won" ? "+350 XP" : "+100 XP"}
                    </div>
                  </div>
                </div>

                <button
                  id="close-match-result-btn"
                  onClick={() => {
                    setActiveMatchModal(null);
                    setMatchResult(null);
                  }}
                  className="w-full py-3 bg-[#141512] text-[#9fe870] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-all cursor-pointer"
                >
                  Continue to Feed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
