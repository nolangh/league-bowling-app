import React, { useState } from "react";
import {
  Users,
  Shield,
  Award,
  Sparkles,
  Edit3,
  UserPlus,
  Check,
  X,
  FileText,
  Zap,
  Activity,
  Flame,
  Search,
} from "lucide-react";
import type { UserProfile, Friend } from "../types";
import { RankBadge } from "./RankBadge";

interface ProfileTabProps {
  user: UserProfile;
  friends: Friend[];
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onAcceptFriendRequest: (userId: number) => Promise<void>;
  onRemoveFriend: (userId: number) => Promise<void>;
  onSendFriendRequest: (userId: number) => Promise<void>;
  onOpenProModal: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  friends,
  onUpdateProfile,
  onAcceptFriendRequest,
  onRemoveFriend,
  onSendFriendRequest,
  onOpenProModal,
}) => {
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [revRate, setRevRate] = useState(String(user.revRate || 420));
  const [ballSpeed, setBallSpeed] = useState(String(user.ballSpeed || 16.8));
  const [axisTilt, setAxisTilt] = useState(String(user.axisTilt || 14));
  const [axisRotation, setAxisRotation] = useState(String(user.axisRotation || 55));
  const [dominantHand, setDominantHand] = useState(user.dominantHand || "Right");
  const [gripStyle, setGripStyle] = useState(user.gripStyle || "Fingertip");
  const [releaseStyle, setReleaseStyle] = useState(user.releaseStyle || "Cranker");
  const [homeAlley, setHomeAlley] = useState(user.homeAlleyName || "Bowlero Midtown Lanes");
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Search bowlers to add
  const [bowlerSearch, setBowlerSearch] = useState("");
  const [statReportOpen, setStatReportOpen] = useState(false);

  const acceptedFriends = friends.filter((f) => f.status === "friend");
  const incomingRequests = friends.filter((f) => f.status === "incoming_request");

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpecs(true);
    try {
      await onUpdateProfile({
        revRate: Number(revRate) || null,
        ballSpeed: Number(ballSpeed) || null,
        axisTilt: Number(axisTilt) || null,
        axisRotation: Number(axisRotation) || null,
        dominantHand,
        gripStyle,
        releaseStyle,
        homeAlleyName: homeAlley,
      });
      setEditingSpecs(false);
    } finally {
      setSavingSpecs(false);
    }
  };

  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));

  return (
    <div id="profile-tab-content" className="space-y-6">
      {/* Bowler Hero Profile Card */}
      <div className="bg-[#1a1a16] text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#9fe870] text-black font-display font-black text-4xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wide uppercase text-white">
                  {user.name}
                </h1>
                {user.isPro ? (
                  <span className="px-2 py-0.5 text-xs font-black bg-[#9fe870] text-black rounded uppercase">
                    PRO MEMBER
                  </span>
                ) : (
                  <button
                    onClick={onOpenProModal}
                    className="px-2.5 py-0.5 text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full hover:bg-amber-400/30 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade to Pro ($4.99/mo)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-stone-300 text-xs">
                <span className="font-bold text-[#9fe870]">@{user.username}</span>
                <span>•</span>
                <RankBadge rank={user.rank} size="sm" />
                <span>•</span>
                <span>Team: <strong>{user.team}</strong></span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3 max-w-sm">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 mb-1">
                  <span className="text-[#9fe870]">LEVEL {user.level}</span>
                  <span>
                    {user.xp} / {user.xpToNext} XP ({xpPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#9fe870] rounded-full transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setStatReportOpen(true)}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#9fe870]" />
              Season Report
            </button>
            <button
              onClick={() => setEditingSpecs(true)}
              className="px-4 py-2 bg-[#9fe870] hover:bg-[#8fd860] text-black text-xs font-black uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Specs
            </button>
          </div>
        </div>
      </div>

      {/* Career Metrics Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">BSR RATING</div>
          <div className="font-display text-3xl font-black text-[#166534] mt-0.5">{user.rating}</div>
          <div className="text-[10px] text-stone-400">Skill Rating</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">CAREER AVERAGE</div>
          <div className="font-display text-3xl font-black text-stone-900 mt-0.5">{user.careerAvg}</div>
          <div className="text-[10px] text-stone-400">All games</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">HIGH GAME</div>
          <div className="font-display text-3xl font-black text-stone-900 mt-0.5">{user.highGame}</div>
          <div className="text-[10px] text-stone-400">Sanctioned peak</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">TOTAL GAMES</div>
          <div className="font-display text-3xl font-black text-stone-900 mt-0.5">{user.totalGames}</div>
          <div className="text-[10px] text-stone-400">Logged games</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">MATCH WINS</div>
          <div className="font-display text-3xl font-black text-emerald-600 mt-0.5">{user.wins}W</div>
          <div className="text-[10px] text-stone-400">Head-to-head</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <div className="text-[10px] font-extrabold uppercase text-stone-400">MATCH LOSSES</div>
          <div className="font-display text-3xl font-black text-rose-600 mt-0.5">{user.losses}L</div>
          <div className="text-[10px] text-stone-400">{Math.round((user.wins / (user.wins + user.losses || 1)) * 100)}% Win Rate</div>
        </div>
      </div>

      {/* Biomechanics & Bowling Delivery Specs */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider">
              BIOMECHANICS & RELEASE
            </span>
            <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
              BOWLER SPECIFICATIONS
            </h3>
          </div>
          <button
            onClick={() => setEditingSpecs(true)}
            className="text-xs font-bold text-stone-500 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">REV RATE</span>
            <span className="font-display text-2xl font-extrabold text-stone-900">{user.revRate || "—"}</span>
            <span className="text-[10px] text-stone-500 block">RPM (Revolutions/min)</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">BALL SPEED</span>
            <span className="font-display text-2xl font-extrabold text-stone-900">{user.ballSpeed || "—"}</span>
            <span className="text-[10px] text-stone-500 block">MPH at pins</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">AXIS TILT</span>
            <span className="font-display text-2xl font-extrabold text-stone-900">{user.axisTilt || "—"}°</span>
            <span className="text-[10px] text-stone-500 block">Pitch angle</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">AXIS ROTATION</span>
            <span className="font-display text-2xl font-extrabold text-stone-900">{user.axisRotation || "—"}°</span>
            <span className="text-[10px] text-stone-500 block">Side roll angle</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">DOMINANT HAND</span>
            <span className="font-bold text-stone-900 text-sm">{user.dominantHand || "Right"}</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">GRIP STYLE</span>
            <span className="font-bold text-stone-900 text-sm">{user.gripStyle || "Fingertip"}</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">RELEASE STYLE</span>
            <span className="font-bold text-stone-900 text-sm">{user.releaseStyle || "Cranker"}</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block">HOME ALLEY</span>
            <span className="font-bold text-stone-900 text-xs truncate block" title={user.homeAlleyName || ""}>
              {user.homeAlleyName || "Bowlero Midtown"}
            </span>
          </div>
        </div>
      </div>

      {/* Friends & Social Roster */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider">
              BOWLER NETWORK
            </span>
            <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
              FRIENDS ({acceptedFriends.length})
            </h3>
          </div>
        </div>

        {/* Incoming requests */}
        {incomingRequests.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
            <span className="text-xs font-extrabold uppercase text-amber-900">
              Incoming Friend Requests ({incomingRequests.length})
            </span>
            <div className="divide-y divide-amber-200/60">
              {incomingRequests.map((req) => (
                <div key={req.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">@{req.username}</span>
                    <RankBadge rank={req.rank} size="sm" />
                    <span className="text-[11px] text-stone-500">Avg: {req.careerAvg}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAcceptFriendRequest(req.id)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => onRemoveFriend(req.id)}
                      className="px-2 py-1 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-300 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {acceptedFriends.map((f) => (
            <div
              key={f.id}
              className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl text-white font-extrabold text-xs flex items-center justify-center shadow-2xs"
                  style={{ backgroundColor: f.avatarColor || "#2a3a5c" }}
                >
                  {f.initials}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-stone-900">@{f.username}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RankBadge rank={f.rank} size="sm" />
                    <span className="text-[10px] text-stone-500">Avg: {f.careerAvg}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemoveFriend(f.id)}
                className="text-stone-300 hover:text-rose-600 p-1 cursor-pointer"
                title="Remove friend"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Specs Modal */}
      {editingSpecs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
                EDIT BOWLER SPECIFICATIONS
              </h3>
              <button
                onClick={() => setEditingSpecs(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpecs} className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Rev Rate (RPM)</label>
                  <input
                    type="number"
                    value={revRate}
                    onChange={(e) => setRevRate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ball Speed (MPH)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ballSpeed}
                    onChange={(e) => setBallSpeed(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Axis Tilt (°)</label>
                  <input
                    type="number"
                    value={axisTilt}
                    onChange={(e) => setAxisTilt(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Axis Rotation (°)</label>
                  <input
                    type="number"
                    value={axisRotation}
                    onChange={(e) => setAxisRotation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dominant Hand</label>
                  <select
                    value={dominantHand}
                    onChange={(e) => setDominantHand(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="Right">Right-Handed</option>
                    <option value="Left">Left-Handed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Release Style</label>
                  <select
                    value={releaseStyle}
                    onChange={(e) => setReleaseStyle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="Stroker">Stroker</option>
                    <option value="Tweener">Tweener</option>
                    <option value="Cranker">Cranker</option>
                    <option value="Two-Handed">Two-Handed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Home Alley Name</label>
                <input
                  type="text"
                  value={homeAlley}
                  onChange={(e) => setHomeAlley(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSpecs(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSpecs}
                  className="px-5 py-2 bg-[#9fe870] hover:bg-[#8fd860] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {savingSpecs ? "Saving..." : "Save Specs"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Season Stat Report Modal */}
      {statReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-[#166534] uppercase">OFFICIAL REPORT</span>
                <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
                  SEASON 2026 BOWLER ANALYTICS
                </h3>
              </div>
              <button
                onClick={() => setStatReportOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">STRIKE PERCENTAGE</span>
                <span className="text-xl font-display font-extrabold text-stone-900">58.4%</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">CLEAN GAME RATE</span>
                <span className="text-xl font-display font-extrabold text-stone-900">74.2%</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">SINGLE PIN SPARES</span>
                <span className="text-xl font-display font-extrabold text-emerald-700">92.1%</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">FIRST BALL AVG</span>
                <span className="text-xl font-display font-extrabold text-stone-900">9.24 Pins</span>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Report generated from verified League game logs and match challenges. Includes USBC sanctioned calculation metrics.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStatReportOpen(false)}
                className="px-5 py-2.5 bg-[#141512] text-[#9fe870] font-black text-xs uppercase rounded-xl hover:bg-black cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
