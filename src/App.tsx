import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ChallengesTab } from "./components/ChallengesTab";
import { MomentsTab } from "./components/MomentsTab";
import { ScoreLogTab } from "./components/ScoreLogTab";
import { LeaderboardTab } from "./components/LeaderboardTab";
import { LeaguesTab } from "./components/LeaguesTab";
import { ArsenalTab } from "./components/ArsenalTab";
import { ProfileTab } from "./components/ProfileTab";
import { ProModal } from "./components/ProModal";
import { PostChallengeModal } from "./components/PostChallengeModal";
import type {
  UserProfile,
  Challenge,
  Moment,
  Game,
  League,
  Ball,
  Friend,
  MomentComment,
  FrameData,
} from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("challenges");
  const [user, setUser] = useState<UserProfile>({
    id: 1,
    username: "STRIKER_AC",
    name: "Alex Chen",
    rank: "Legend",
    rating: 1842,
    careerAvg: 218,
    highGame: 300,
    totalGames: 847,
    wins: 34,
    losses: 12,
    isPro: true,
    level: 42,
    xp: 12450,
    xpToNext: 15000,
    team: "Strike Force",
    revRate: 420,
    ballSpeed: 16.8,
    axisTilt: 14,
    axisRotation: 55,
    dominantHand: "Right",
    gripStyle: "Fingertip",
    releaseStyle: "Cranker",
    homeAlleyName: "Bowlero Midtown Lanes",
  });

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Modals
  const [proModalOpen, setProModalOpen] = useState(false);
  const [postChallengeOpen, setPostChallengeOpen] = useState(false);
  const [challengePresetUser, setChallengePresetUser] = useState<{ username: string; avg: number } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Safe JSON Fetch Helper
  const fetchSafeJson = async <T,>(url: string, defaultValue: T): Promise<T> => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Fetch returned status ${res.status} for ${url}`);
        return defaultValue;
      }
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch (parseErr) {
        console.warn(`Non-JSON response from ${url}:`, text.slice(0, 100));
        return defaultValue;
      }
    } catch (err) {
      console.warn(`Network error fetching ${url}:`, err);
      return defaultValue;
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      try {
        const [
          userData,
          chalData,
          momData,
          gameData,
          leaData,
          ballData,
          friData,
          leadData,
        ] = await Promise.all([
          fetchSafeJson<UserProfile | null>("/api/user", null),
          fetchSafeJson<Challenge[]>("/api/challenges", []),
          fetchSafeJson<Moment[]>("/api/moments", []),
          fetchSafeJson<Game[]>("/api/games", []),
          fetchSafeJson<League[]>("/api/leagues", []),
          fetchSafeJson<Ball[]>("/api/balls", []),
          fetchSafeJson<Friend[]>("/api/friends", []),
          fetchSafeJson<UserProfile[]>("/api/leaderboard", []),
        ]);

        if (userData && userData.id) setUser(userData);
        if (Array.isArray(chalData) && chalData.length > 0) setChallenges(chalData);
        if (Array.isArray(momData) && momData.length > 0) setMoments(momData);
        if (Array.isArray(gameData) && gameData.length > 0) setGames(gameData);
        if (Array.isArray(leaData) && leaData.length > 0) setLeagues(leaData);
        if (Array.isArray(ballData) && ballData.length > 0) setBalls(ballData);
        if (Array.isArray(friData) && friData.length > 0) setFriends(friData);
        if (Array.isArray(leadData) && leadData.length > 0) setLeaderboard(leadData);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    }
    loadData();
  }, []);

  // Handlers for Challenges
  const handlePostChallenge = async (score: number, stake: number, notes: string) => {
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, stake, notes }),
      });
      const data = await res.json();
      if (data && data.id) {
        setChallenges((prev) => [data, ...prev]);
        setUser((u) => ({ ...u, xp: u.xp + 100 }));
        showToast(`Challenge posted for ${score} pins ($${stake} Stake)! +100 XP`);
      }
    } catch (e) {
      console.error(e);
      showToast("Error posting challenge");
    }
  };

  const handleAcceptChallenge = async (id: string) => {
    try {
      const res = await fetch(`/api/challenges/${id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (data && data.id) {
        setChallenges((prev) => prev.map((c) => (c.id === id ? data : c)));
        showToast("Match accepted! Submit your final score to resolve.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteChallenge = async (id: string, score: number) => {
    try {
      const res = await fetch(`/api/challenges/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (data && data.challenge) {
        setChallenges((prev) => prev.map((c) => (c.id === id ? data.challenge : c)));
        setUser((u) => ({
          ...u,
          rating: u.rating + data.bsrChange,
          wins: data.result === "won" ? u.wins + 1 : u.wins,
          losses: data.result === "lost" ? u.losses + 1 : u.losses,
          xp: u.xp + (data.result === "won" ? 350 : 100),
        }));
        showToast(
          data.result === "won"
            ? `Victory! +${data.bsrChange} BSR and +350 XP`
            : `Match finished. ${data.bsrChange} BSR and +100 XP`
        );
        return { result: data.result, bsrChange: data.bsrChange };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      await fetch(`/api/challenges/${id}`, { method: "DELETE" });
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      showToast("Challenge canceled.");
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Moments
  const handlePostMoment = async (content: string, score?: number, type?: string) => {
    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, score, type }),
      });
      const data = await res.json();
      if (data && data.id) {
        setMoments((prev) => [data, ...prev]);
        setUser((u) => ({ ...u, xp: u.xp + 75 }));
        showToast("Moment published! +75 XP");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLikeMoment = async (id: string) => {
    try {
      const res = await fetch(`/api/moments/${id}/like`, { method: "POST" });
      const data = await res.json();
      if (data && data.id) {
        setMoments((prev) => prev.map((m) => (m.id === id ? data : m)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDislikeMoment = async (id: string) => {
    try {
      const res = await fetch(`/api/moments/${id}/dislike`, { method: "POST" });
      const data = await res.json();
      if (data && data.id) {
        setMoments((prev) => prev.map((m) => (m.id === id ? data : m)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMoment = async (id: string) => {
    try {
      const res = await fetch(`/api/moments/${id}/save`, { method: "POST" });
      const data = await res.json();
      if (data && data.id) {
        setMoments((prev) => prev.map((m) => (m.id === id ? data : m)));
        showToast(data.isSaved ? "Saved to your bookmarks" : "Removed from bookmarks");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchComments = async (momentId: string): Promise<MomentComment[]> => {
    try {
      const res = await fetch(`/api/moments/${momentId}/comments`);
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handlePostComment = async (momentId: string, content: string) => {
    try {
      const res = await fetch(`/api/moments/${momentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data && data.id) {
        setMoments((prev) =>
          prev.map((m) => (m.id === momentId ? { ...m, commentsCount: m.commentsCount + 1 } : m))
        );
        showToast("Comment posted!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Games
  const handleLogGame = async (gameData: {
    score: number;
    alley: string;
    oilPattern: string;
    ballUsed: string;
    notes: string;
    frames?: FrameData[];
    entryMethod?: "quick" | "frames" | "photo";
  }) => {
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameData),
      });
      const data = await res.json();
      if (data && data.id) {
        setGames((prev) => [data, ...prev]);
        const xpEarned = Math.round(gameData.score * 1.5);
        setUser((u) => {
          const totalG = u.totalGames + 1;
          const newAvg = Math.round((u.careerAvg * u.totalGames + gameData.score) / totalG);
          const newHigh = Math.max(u.highGame, gameData.score);
          return {
            ...u,
            totalGames: totalG,
            careerAvg: newAvg,
            highGame: newHigh,
            xp: u.xp + xpEarned,
          };
        });
        showToast(`Game logged: ${gameData.score} pins! +${xpEarned} XP`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGame = async (id: string) => {
    try {
      await fetch(`/api/games/${id}`, { method: "DELETE" });
      setGames((prev) => prev.filter((g) => g.id !== id));
      showToast("Game removed from career history");
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Leagues
  const handleJoinLeague = async (id: string) => {
    try {
      const res = await fetch(`/api/leagues/${id}/join`, { method: "POST" });
      const data = await res.json();
      if (data && data.id) {
        setLeagues((prev) => prev.map((l) => (l.id === id ? data : l)));
        showToast(data.isJoined ? `Joined ${data.name}!` : `Left ${data.name}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Arsenal Balls
  const handleAddBall = async (ballData: Partial<Ball>) => {
    try {
      const res = await fetch("/api/balls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ballData),
      });
      const data = await res.json();
      if (data && data.id) {
        setBalls((prev) => [...prev, data]);
        showToast(`Added ${data.name} to your arsenal!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBall = async (id: string) => {
    try {
      await fetch(`/api/balls/${id}`, { method: "DELETE" });
      setBalls((prev) => prev.filter((b) => b.id !== id));
      showToast("Ball removed from arsenal.");
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Profile & Friends
  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      if (updated && updated.id) {
        setUser(updated);
        showToast("Bowler specifications saved.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptFriendRequest = async (userId: number) => {
    try {
      const res = await fetch(`/api/friends/${userId}/accept`, { method: "POST" });
      const data = await res.json();
      if (data) {
        setFriends((prev) =>
          prev.map((f) => (f.id === userId ? { ...f, status: "friend" as const } : f))
        );
        showToast("Friend request accepted!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFriend = async (userId: number) => {
    try {
      await fetch(`/api/friends/${userId}`, { method: "DELETE" });
      setFriends((prev) => prev.filter((f) => f.id !== userId));
      showToast("Friend removed.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      await fetch(`/api/friends/${userId}/request`, { method: "POST" });
      showToast("Friend request sent!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradePro = async () => {
    try {
      const res = await fetch("/api/user/upgrade-pro", { method: "POST" });
      const data = await res.json();
      if (data && data.isPro) {
        setUser((u) => ({ ...u, isPro: true }));
        showToast("Welcome to League Pro! All perks unlocked.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const myChallenges = challenges.filter((c) => c.userId === user.id);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-stone-900 flex flex-col font-sans selection:bg-[#9fe870] selection:text-black">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141512] text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9fe870] animate-pulse" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenLogModal={() => setActiveTab("log")}
        onOpenChallengeModal={() => {
          setChallengePresetUser(null);
          setPostChallengeOpen(true);
        }}
        onOpenProModal={() => setProModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "challenges" && (
          <ChallengesTab
            challenges={challenges}
            myChallenges={myChallenges}
            user={user}
            onPostChallenge={handlePostChallenge}
            onAcceptChallenge={handleAcceptChallenge}
            onCompleteChallenge={handleCompleteChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            onOpenPostModal={() => {
              setChallengePresetUser(null);
              setPostChallengeOpen(true);
            }}
          />
        )}

        {activeTab === "moments" && (
          <MomentsTab
            moments={moments}
            user={user}
            onPostMoment={handlePostMoment}
            onLikeMoment={handleLikeMoment}
            onDislikeMoment={handleDislikeMoment}
            onSaveMoment={handleSaveMoment}
            onFetchComments={handleFetchComments}
            onPostComment={handlePostComment}
          />
        )}

        {activeTab === "log" && (
          <ScoreLogTab
            games={games}
            balls={balls}
            user={user}
            onLogGame={handleLogGame}
            onDeleteGame={handleDeleteGame}
            onOpenLogModal={() => {}}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab
            user={user}
            leaderboardData={leaderboard}
            onOpenChallengeModalWithUser={(username, avg) => {
              setChallengePresetUser({ username, avg });
              setPostChallengeOpen(true);
            }}
          />
        )}

        {activeTab === "leagues" && (
          <LeaguesTab
            leagues={leagues}
            user={user}
            onJoinLeague={handleJoinLeague}
          />
        )}

        {activeTab === "arsenal" && (
          <ArsenalTab
            balls={balls}
            user={user}
            onAddBall={handleAddBall}
            onDeleteBall={handleDeleteBall}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            friends={friends}
            onUpdateProfile={handleUpdateProfile}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onSendFriendRequest={handleSendFriendRequest}
            onOpenProModal={() => setProModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#141512] text-stone-400 py-6 border-t border-stone-800 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-black text-white">LEAGUE</span>
            <span className="text-stone-500">•</span>
            <span>Bowling Skill Rating & Matchmaking Platform</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>USBC Sanctioned Calculations</span>
            <span>•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        user={user}
        onUpgrade={handleUpgradePro}
      />

      <PostChallengeModal
        isOpen={postChallengeOpen}
        onClose={() => {
          setPostChallengeOpen(false);
          setChallengePresetUser(null);
        }}
        user={user}
        initialTargetScore={challengePresetUser?.avg ? Math.min(300, challengePresetUser.avg + 10) : undefined}
        initialOpponent={challengePresetUser?.username}
        onPost={handlePostChallenge}
      />
    </div>
  );
}

export default App;
