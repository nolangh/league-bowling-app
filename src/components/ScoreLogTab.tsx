import React, { useState } from "react";
import {
  Award,
  Calendar,
  MapPin,
  Flame,
  CheckCircle2,
  Sparkles,
  Camera,
  Trash2,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { Game, Ball, UserProfile, FrameData } from "../types";

interface ScoreLogTabProps {
  games: Game[];
  balls: Ball[];
  user: UserProfile;
  onLogGame: (gameData: {
    score: number;
    alley: string;
    oilPattern: string;
    ballUsed: string;
    notes: string;
    frames?: FrameData[];
    entryMethod?: "quick" | "frames" | "photo";
  }) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
  onOpenLogModal: () => void;
}

export const ScoreLogTab: React.FC<ScoreLogTabProps> = ({
  games,
  balls,
  user,
  onLogGame,
  onDeleteGame,
  onOpenLogModal,
}) => {
  const [entryMode, setEntryMode] = useState<"quick" | "frames" | "ai_scan">("quick");
  const [quickScore, setQuickScore] = useState("");
  const [selectedAlley, setSelectedAlley] = useState("Bowlero Midtown Lanes");
  const [selectedPattern, setSelectedPattern] = useState("House Shot");
  const [selectedBall, setSelectedBall] = useState(balls[0]?.name || "Storm Phaze II");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 10-Frame Scorecard State
  const [frames, setFrames] = useState<Array<{ b1: string; b2: string; b3?: string }>>([
    { b1: "X", b2: "" },
    { b1: "9", b2: "/" },
    { b1: "X", b2: "" },
    { b1: "X", b2: "" },
    { b1: "X", b2: "" },
    { b1: "9", b2: "/" },
    { b1: "X", b2: "" },
    { b1: "X", b2: "" },
    { b1: "X", b2: "" },
    { b1: "X", b2: "X", b3: "X" },
  ]);

  // AI Scanner simulation state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    score: number;
    confidence: number;
    detectedAlley: string;
    detectedPattern: string;
    analysis: string;
  } | null>(null);

  const oilPatterns = [
    "House Shot",
    "Viper 36ft (Sport)",
    "Chameleon 39ft (Sport)",
    "Scorpion 42ft (Sport)",
    "Shark 43ft (Sport)",
    "Cheetah 35ft (Sport)",
    "USBC Flat Sport 40ft",
  ];

  const alleys = [
    "Bowlero Midtown Lanes",
    "Sunset National Lanes",
    "AMF Pro Bowl & Lounge",
    "Thunderbird Bowl",
    "Metro Super Lanes",
  ];

  const handleSimulateAiScan = () => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      const generatedScore = Math.floor(Math.random() * 50 + 230); // 230 - 280
      setScanResult({
        score: generatedScore,
        confidence: 0.98,
        detectedAlley: selectedAlley,
        detectedPattern: "House Shot 41ft",
        analysis: `Verified 10-frame score sheet. Confirmed ${Math.floor(generatedScore / 25)} strikes and ${Math.floor((300 - generatedScore) / 30)} spares.`,
      });
      setQuickScore(String(generatedScore));
      setScanning(false);
    }, 1500);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseInt(quickScore);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 300) return;

    setIsSubmitting(true);
    try {
      await onLogGame({
        score: scoreVal,
        alley: selectedAlley,
        oilPattern: selectedPattern,
        ballUsed: selectedBall,
        notes: notes.trim(),
        entryMethod: entryMode === "ai_scan" ? "photo" : "quick",
      });
      setQuickScore("");
      setNotes("");
      setScanResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFrameScoreTotal = () => {
    // Basic approximate frame total estimation for interactive display
    let strikes = 0;
    let spares = 0;
    frames.forEach((f) => {
      if (f.b1 === "X") strikes++;
      if (f.b2 === "/") spares++;
      if (f.b2 === "X") strikes++;
      if (f.b3 === "X") strikes++;
    });
    return Math.min(300, Math.max(60, strikes * 26 + spares * 16 + 40));
  };

  const handleFrameSubmit = async () => {
    const calculatedScore = calculateFrameScoreTotal();
    setIsSubmitting(true);
    try {
      await onLogGame({
        score: calculatedScore,
        alley: selectedAlley,
        oilPattern: selectedPattern,
        ballUsed: selectedBall,
        notes: notes.trim() || "10-frame score card entry",
        entryMethod: "frames",
      });
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalGamesLogged = games.length;
  const avgScore = totalGamesLogged > 0 ? Math.round(games.reduce((a, b) => a + b.score, 0) / totalGamesLogged) : 0;
  const bestScore = totalGamesLogged > 0 ? Math.max(...games.map((g) => g.score)) : 0;

  return (
    <div id="score-log-tab-content" className="space-y-6">
      {/* Session Overview Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1a1a16] text-white p-4 rounded-2xl border border-stone-800 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-stone-400">SESSION AVERAGE</div>
          <div className="text-3xl font-display font-extrabold text-[#9fe870]">{avgScore || user.careerAvg}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Across {totalGamesLogged} logged games</div>
        </div>
        <div className="bg-[#1a1a16] text-white p-4 rounded-2xl border border-stone-800 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-stone-400">HIGH GAME</div>
          <div className="text-3xl font-display font-extrabold text-white">{bestScore || user.highGame}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Personal career peak</div>
        </div>
        <div className="bg-[#1a1a16] text-white p-4 rounded-2xl border border-stone-800 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-stone-400">TOTAL PIN CARRIER</div>
          <div className="text-3xl font-display font-extrabold text-white">
            {games.reduce((acc, g) => acc + g.score, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Pins knocked down</div>
        </div>
        <div className="bg-[#1a1a16] text-white p-4 rounded-2xl border border-stone-800 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-stone-400">XP FROM GAMES</div>
          <div className="text-3xl font-display font-extrabold text-[#9fe870]">+{user.xp}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Level {user.level} Bowler</div>
        </div>
      </div>

      {/* Logger Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#9fe870] text-black rounded-full uppercase">
              SCORE TRACKER
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 uppercase mt-1">
              LOG NEW BOWLING GAME
            </h2>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setEntryMode("quick")}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                entryMode === "quick"
                  ? "bg-[#141512] text-[#9fe870] shadow-sm"
                  : "text-stone-600 hover:text-black"
              }`}
            >
              Quick Score
            </button>
            <button
              onClick={() => setEntryMode("frames")}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                entryMode === "frames"
                  ? "bg-[#141512] text-[#9fe870] shadow-sm"
                  : "text-stone-600 hover:text-black"
              }`}
            >
              10-Frame Card
            </button>
            <button
              onClick={() => setEntryMode("ai_scan")}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                entryMode === "ai_scan"
                  ? "bg-[#141512] text-[#9fe870] shadow-sm"
                  : "text-stone-600 hover:text-black"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#9fe870]" />
              AI Scan
            </button>
          </div>
        </div>

        {/* Quick Mode */}
        {entryMode === "quick" && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Score Input display */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/90 flex flex-col items-center justify-center text-center">
                <label className="text-xs font-extrabold text-stone-700 uppercase tracking-wider mb-2">
                  Final Score (0 - 300)
                </label>
                <input
                  id="quick-game-score-input"
                  type="number"
                  min="0"
                  max="300"
                  required
                  placeholder="e.g. 268"
                  value={quickScore}
                  onChange={(e) => setQuickScore(e.target.value)}
                  className="w-48 text-center font-display text-5xl font-extrabold bg-white border-2 border-stone-300 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-black"
                />
                <span className="text-[11px] text-stone-400 mt-2">Perfect Game = 300</span>
              </div>

              {/* Match attributes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bowling Alley / Center</label>
                  <select
                    value={selectedAlley}
                    onChange={(e) => setSelectedAlley(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
                  >
                    {alleys.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Oil Pattern Condition</label>
                  <select
                    value={selectedPattern}
                    onChange={(e) => setSelectedPattern(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
                  >
                    {oilPatterns.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ball Used from Arsenal</label>
                  <select
                    value={selectedBall}
                    onChange={(e) => setSelectedBall(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
                  >
                    {balls.map((b) => (
                      <option key={b.id} value={`${b.brand} ${b.name}`}>
                        {b.brand} {b.name} ({b.weight} lbs - {b.coverstock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Session Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 5 in a row from frame 4, smooth backend carry on lane 12"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="submit-quick-game-btn"
                type="submit"
                disabled={!quickScore || isSubmitting}
                className="px-6 py-2.5 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {isSubmitting ? "Saving..." : "Save Game to Career (+XP)"}
              </button>
            </div>
          </form>
        )}

        {/* 10-Frame Card Mode */}
        {entryMode === "frames" && (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              Interactive 10-frame bowling scorecard grid. Enter rolls (X for strike, / for spare, 0-9 for count).
            </p>

            {/* Scorecard Table */}
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-10 gap-1.5 min-w-[650px] bg-stone-900 p-3 rounded-2xl text-white">
                {frames.map((f, i) => (
                  <div key={i} className="bg-stone-800 rounded-xl p-2 text-center border border-stone-700">
                    <div className="text-[10px] font-extrabold text-[#9fe870] mb-1">F{i + 1}</div>
                    <div className="flex items-center justify-center gap-1 my-1">
                      <input
                        type="text"
                        maxLength={2}
                        value={f.b1}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const next = [...frames];
                          next[i].b1 = val;
                          setFrames(next);
                        }}
                        className="w-7 h-7 bg-stone-900 border border-stone-700 text-center font-bold text-xs rounded text-white focus:outline-none focus:border-[#9fe870]"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={f.b2}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const next = [...frames];
                          next[i].b2 = val;
                          setFrames(next);
                        }}
                        className="w-7 h-7 bg-stone-900 border border-stone-700 text-center font-bold text-xs rounded text-white focus:outline-none focus:border-[#9fe870]"
                      />
                      {i === 9 && (
                        <input
                          type="text"
                          maxLength={2}
                          value={f.b3 || ""}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            const next = [...frames];
                            next[i].b3 = val;
                            setFrames(next);
                          }}
                          className="w-7 h-7 bg-stone-900 border border-stone-700 text-center font-bold text-xs rounded text-white focus:outline-none focus:border-[#9fe870]"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase">CALCULATED SCORE</div>
                <div className="font-display text-4xl font-extrabold text-stone-900">
                  {calculateFrameScoreTotal()}
                </div>
              </div>
              <button
                id="submit-frame-card-btn"
                onClick={handleFrameSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#9fe870] hover:bg-[#8fd860] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {isSubmitting ? "Logging..." : "Log Complete Scorecard"}
              </button>
            </div>
          </div>
        )}

        {/* AI Scan Mode */}
        {entryMode === "ai_scan" && (
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#9fe870]/20 text-[#166534] mx-auto flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold uppercase text-stone-900">
                AI SCORECARD OCR & VERIFIER
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Scan your alley overhead TV screen or printed receipt to automatically verify score and pinfall stats.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                id="run-ai-scan-btn"
                type="button"
                disabled={scanning}
                onClick={handleSimulateAiScan}
                className="px-5 py-2.5 bg-[#141512] hover:bg-black text-[#9fe870] font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                {scanning ? "Scanning Scorecard..." : "Simulate Scorecard Photo Scan"}
              </button>
            </div>

            {scanResult && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-extrabold text-emerald-900">Scorecard Verified</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                      {(scanResult.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="font-display text-3xl font-extrabold text-stone-900">
                    {scanResult.score}
                  </div>
                </div>
                <p className="text-xs text-stone-600 italic">"{scanResult.analysis}"</p>

                <div className="pt-2 flex justify-end">
                  <button
                    id="accept-ai-score-btn"
                    onClick={handleQuickSubmit}
                    className="px-4 py-2 bg-[#9fe870] text-black text-xs font-black uppercase rounded-xl hover:bg-[#8fd860]"
                  >
                    Accept Verified Score & Log
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logged Games History List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-extrabold text-stone-900 uppercase">
            RECENT GAMES LOG ({games.length})
          </h3>
          <span className="text-xs text-stone-400 font-bold">Official Career Log</span>
        </div>

        <div className="divide-y divide-stone-100">
          {games.map((g) => (
            <div
              key={g.id}
              id={`game-log-row-${g.id}`}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#141512] text-white flex flex-col items-center justify-center font-display font-extrabold shadow-sm shrink-0">
                  <span className="text-2xl leading-none text-[#9fe870]">{g.score}</span>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400">PINS</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-stone-900">{g.alley}</span>
                    {g.verified && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>Pattern: <strong>{g.oilPattern}</strong></span>
                    <span>•</span>
                    <span>Ball: <strong>{g.ballUsed}</strong></span>
                  </div>
                  {g.notes && <p className="text-[11px] text-stone-500 italic mt-1">"{g.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-700">{g.date}</div>
                  <div className="text-[10px] text-stone-400 uppercase">+{Math.round(g.score * 1.5)} XP</div>
                </div>
                <button
                  onClick={() => onDeleteGame(g.id)}
                  className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete game"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
