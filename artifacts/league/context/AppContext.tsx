import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";

export type Rank =
  | "Rookie" | "Amateur" | "Intermediate" | "Advanced"
  | "Expert" | "Elite" | "Diamond IV" | "Diamond III"
  | "Diamond II" | "Diamond I" | "Platinum II" | "Platinum I"
  | "Legend" | "Kingpin";

export interface UserProfile {
  id?: number;
  name: string;
  username: string;
  rank: Rank;
  level: number;
  xp: number;
  xpToNext: number;
  isPro: boolean;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  team: string;
  rating: number;
  wins: number;
  losses: number;
  earnings: number;
  paymentProvider?: string;
  paymentHandle?: string;
}

export interface Game {
  id: string;
  score: number;
  date: string;
  alley: string;
  oilPattern: string;
  ballUsed: string;
  notes: string;
  verified: boolean;
}

export interface Challenge {
  id: string;
  username: string;
  rank: Rank;
  rankColor: string;
  postedScore: number;
  stake: number;
  timeAgo: string;
  isPro: boolean;
  status: "open" | "active" | "completed" | "cancelled";
  initials: string;
  avatarColor: string;
  isOwn?: boolean;
  progress?: number;
  matchesRequired?: number;
  matchesPlayed?: number;
  description?: string;
  acceptorId?: number;
  acceptorUsername?: string;
  winnerId?: number;
  completedAt?: string;
  result?: "won" | "lost";
}

export interface Moment {
  id: string;
  userId?: number;
  username: string;
  rank: Rank;
  rankColor: string;
  content: string;
  score?: number;
  type: "strike" | "game" | "challenge" | "advice";
  likes: number;
  comments: number;
  dislikes: number;
  saves: number;
  tags: string[];
  timeAgo: string;
  liked: boolean;
  disliked: boolean;
  saved: boolean;
  initials: string;
  avatarColor: string;
  createdAt?: string;
}

export interface Comment {
  id: string;
  momentId: string;
  userId: number;
  username: string;
  initials: string;
  avatarColor: string;
  rank: Rank;
  rankColor: string;
  content: string;
  timeAgo: string;
  isOwn: boolean;
}

export interface Friend {
  id: string;
  userId: number;
  username: string;
  name: string;
  rank: Rank;
  rankColor: string;
  rating: number;
  careerAvg: number;
  highGame: number;
  isPro: boolean;
  initials: string;
  avatarColor: string;
  friendsSince?: string | null;
  friendStatus?: string | null;
}

export interface LeaderboardEntry {
  position: number;
  id: number;
  username: string;
  name: string;
  rank: Rank;
  rankColor: string;
  rating: number;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  isPro: boolean;
  team: string;
  initials: string;
  avatarColor: string;
  isMe: boolean;
}

export interface League {
  id: string;
  name: string;
  description: string;
  members: number;
  type: "public" | "private";
  level: string;
  avgScore: number;
  weeklyChallenge?: string;
  joined?: boolean;
}

const RANK_COLORS: Record<string, string> = {
  Rookie: "#a0a0a0", Amateur: "#a0a0a0",
  Intermediate: "#a8c870", Advanced: "#a8c870",
  Expert: "#f5c842", Elite: "#f5c842",
  "Diamond IV": "#60c8ff", "Diamond III": "#60c8ff",
  "Diamond II": "#60c8ff", "Diamond I": "#60c8ff",
  "Platinum II": "#c8a8e8", "Platinum I": "#c8a8e8",
  Legend: "#9fe870", Kingpin: "#ff6b35",
};

export function getRankColor(rank: Rank | string): string {
  return RANK_COLORS[rank] ?? "#a0a0a0";
}

const FALLBACK_USER: UserProfile = {
  name: "Bowler", username: "BOWLER", rank: "Rookie",
  level: 1, xp: 0, xpToNext: 1000, isPro: false,
  careerAvg: 0, highGame: 0, totalGames: 0, team: "Solo", rating: 1000,
  wins: 0, losses: 0, earnings: 0,
};

interface AppContextValue {
  user: UserProfile;
  games: Game[];
  challenges: Challenge[];
  myActiveChallenges: Challenge[];
  acceptedChallenges: Challenge[];
  completedChallenges: Challenge[];
  moments: Moment[];
  leagues: League[];
  loading: boolean;
  logGame: (game: Omit<Game, "id">) => Promise<void>;
  toggleLikeMoment: (momentId: string) => void;
  toggleDislikeMoment: (momentId: string) => void;
  saveMoment: (momentId: string, listId?: number) => Promise<void>;
  unsaveMoment: (momentId: string) => Promise<void>;
  postMoment: (content: string, type: Moment["type"], score?: number, tags?: string[]) => Promise<void>;
  acceptChallenge: (challengeId: string) => void;
  postChallenge: (score: number, stake: number) => void;
  deleteChallenge: (challengeId: string) => Promise<void>;
  completeChallenge: (challengeId: string, result: "won" | "lost") => Promise<void>;
  setUserPro: (isPro: boolean) => void;
  updatePaymentInfo: (provider: string, handle: string) => Promise<void>;
  joinLeague: (leagueId: string) => void;
  refreshAll: () => Promise<void>;
  // Friends
  sendFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

type ApiGame = {
  id: number; score: number; date: string; alley: string;
  oilPattern: string; ballUsed: string; notes: string; verified: boolean;
};
type ApiChallenge = {
  id: number; username: string; rank: string; rankColor: string;
  postedScore: number; stake: number; timeAgo: string; isPro: boolean;
  status: string; initials: string; avatarColor: string;
  acceptorId?: number | null;
  acceptorUsername?: string | null;
  winnerId?: number | null;
  completedAt?: string | null;
  result?: "won" | "lost";
};
type ApiMoment = {
  id: number; userId?: number; username: string; rank: string; rankColor: string;
  content: string; score?: number | null; type: string;
  likes: number; comments: number; dislikes?: number; saves?: number; tags?: string[];
  timeAgo: string; liked: boolean; disliked?: boolean; saved?: boolean;
  initials: string; avatarColor: string; createdAt?: string;
};
type ApiLeague = {
  id: number; name: string; description: string; members: number;
  type: string; level: string; avgScore: number;
  weeklyChallenge?: string | null; joined: boolean;
};
type ApiUser = {
  id: number; name: string; username: string; rank: string;
  level: number; xp: number; xpToNext: number; isPro: boolean;
  careerAvg: number; highGame: number; totalGames: number;
  team: string; rating: number;
  wins: number; losses: number; earnings: number;
  paymentProvider?: string | null;
  paymentHandle?: string | null;
};

function toGame(g: ApiGame): Game { return { ...g, id: String(g.id) }; }
function toChallenge(c: ApiChallenge): Challenge {
  return {
    ...c,
    id: String(c.id),
    rank: c.rank as Rank,
    status: c.status as Challenge["status"],
    acceptorId: c.acceptorId ?? undefined,
    acceptorUsername: c.acceptorUsername ?? undefined,
    winnerId: c.winnerId ?? undefined,
    completedAt: c.completedAt ?? undefined,
    result: c.result,
  };
}
function toMoment(m: ApiMoment): Moment {
  return {
    ...m,
    id: String(m.id),
    rank: m.rank as Rank,
    score: m.score ?? undefined,
    type: m.type as Moment["type"],
    dislikes: m.dislikes ?? 0,
    saves: m.saves ?? 0,
    tags: m.tags ?? [],
    disliked: m.disliked ?? false,
    saved: m.saved ?? false,
  };
}
function toLeague(l: ApiLeague): League {
  return { ...l, id: String(l.id), type: l.type as League["type"], weeklyChallenge: l.weeklyChallenge ?? undefined };
}
function toUser(u: ApiUser): UserProfile {
  return {
    ...u,
    rank: u.rank as Rank,
    wins: u.wins ?? 0,
    losses: u.losses ?? 0,
    earnings: u.earnings ?? 0,
    paymentProvider: u.paymentProvider ?? undefined,
    paymentHandle: u.paymentHandle ?? undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(FALLBACK_USER);
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myActiveChallenges, setMyActiveChallenges] = useState<Challenge[]>([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
    setupRealtime();
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  function setupRealtime() {
    const channel = supabase
      .channel("moments-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "moments" }, (payload) => {
        const raw = payload.new as ApiMoment & { created_at: string; rank_color?: string; avatar_color?: string; comment_count?: number; dislike_count?: number; save_count?: number };
        const newMoment: Moment = {
          id: String(raw.id),
          username: raw.username,
          rank: raw.rank as Rank,
          rankColor: raw.rank_color ?? raw.rankColor ?? "#a0a0a0",
          content: raw.content,
          score: raw.score ?? undefined,
          type: raw.type as Moment["type"],
          likes: raw.likes ?? 0,
          comments: raw.comment_count ?? raw.comments ?? 0,
          dislikes: raw.dislike_count ?? 0,
          saves: raw.save_count ?? 0,
          tags: raw.tags ?? [],
          timeAgo: "just now",
          liked: false,
          disliked: false,
          saved: false,
          initials: raw.initials ?? raw.username.slice(0, 2),
          avatarColor: raw.avatar_color ?? raw.avatarColor ?? "#1a3c2a",
          createdAt: raw.created_at,
        };
        setMoments((prev) => [newMoment, ...prev]);
      })
      .subscribe();
    realtimeRef.current = channel;
  }

  async function refreshAll() {
    try {
      const [userRes, gamesRes, challengesRes, myChallRes, acceptedChallRes, completedChallRes, momentsRes, leaguesRes] =
        await Promise.allSettled([
          api.get<ApiUser>("/users/me"),
          api.get<ApiGame[]>("/games"),
          api.get<ApiChallenge[]>("/challenges"),
          api.get<ApiChallenge[]>("/challenges/my"),
          api.get<ApiChallenge[]>("/challenges/accepted"),
          api.get<ApiChallenge[]>("/challenges/completed"),
          api.get<ApiMoment[]>("/moments"),
          api.get<ApiLeague[]>("/leagues"),
        ]);

      if (userRes.status === "fulfilled") setUser(toUser(userRes.value));
      if (gamesRes.status === "fulfilled") setGames(gamesRes.value.map(toGame));
      if (challengesRes.status === "fulfilled") setChallenges(challengesRes.value.map(toChallenge));
      if (myChallRes.status === "fulfilled") setMyActiveChallenges(myChallRes.value.map(toChallenge));
      if (acceptedChallRes.status === "fulfilled") setAcceptedChallenges(acceptedChallRes.value.map(toChallenge));
      if (completedChallRes.status === "fulfilled") setCompletedChallenges(completedChallRes.value.map(toChallenge));
      if (momentsRes.status === "fulfilled") setMoments(momentsRes.value.map(toMoment));
      if (leaguesRes.status === "fulfilled") setLeagues(leaguesRes.value.map(toLeague));
    } catch {
      // keep fallback state
    }
  }

  const logGame = async (gameData: Omit<Game, "id">) => {
    const created = await api.post<ApiGame>("/games", gameData);
    setGames((prev) => [toGame(created), ...prev]);
    const updatedUser = await api.get<ApiUser>("/users/me");
    setUser(toUser(updatedUser));
  };

  const toggleLikeMoment = async (momentId: string) => {
    const current = moments.find((m) => m.id === momentId);
    if (!current) return;
    setMoments((prev) =>
      prev.map((m) =>
        m.id === momentId
          ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1, disliked: m.liked ? m.disliked : false }
          : m
      )
    );
    try {
      let updated: ApiMoment;
      if (current.liked) {
        updated = await api.delete<ApiMoment>(`/moments/${momentId}/like`);
      } else {
        updated = await api.post<ApiMoment>(`/moments/${momentId}/like`);
      }
      setMoments((prev) => prev.map((m) => (m.id === momentId ? toMoment(updated) : m)));
    } catch { /* keep optimistic */ }
  };

  const toggleDislikeMoment = async (momentId: string) => {
    const current = moments.find((m) => m.id === momentId);
    if (!current) return;
    setMoments((prev) =>
      prev.map((m) =>
        m.id === momentId
          ? { ...m, disliked: !m.disliked, dislikes: m.disliked ? m.dislikes - 1 : m.dislikes + 1, liked: m.disliked ? m.liked : false }
          : m
      )
    );
    try {
      if (current.disliked) {
        await api.delete(`/moments/${momentId}/dislike`);
      } else {
        await api.post(`/moments/${momentId}/dislike`);
      }
      const updated = await api.get<ApiMoment>(`/moments/${momentId}`);
      setMoments((prev) => prev.map((m) => (m.id === momentId ? toMoment(updated) : m)));
    } catch { /* keep optimistic */ }
  };

  const saveMoment = async (momentId: string, listId?: number) => {
    setMoments((prev) =>
      prev.map((m) => m.id === momentId ? { ...m, saved: true, saves: m.saves + 1 } : m)
    );
    try {
      await api.post(`/moments/${momentId}/save`, listId ? { listId } : {});
    } catch { /* keep optimistic */ }
  };

  const unsaveMoment = async (momentId: string) => {
    setMoments((prev) =>
      prev.map((m) => m.id === momentId ? { ...m, saved: false, saves: Math.max(0, m.saves - 1) } : m)
    );
    try {
      await api.delete(`/moments/${momentId}/save`);
    } catch { /* keep optimistic */ }
  };

  const postMoment = async (content: string, type: Moment["type"], score?: number, tags?: string[]) => {
    try {
      const created = await api.post<ApiMoment>("/moments", { content, type, score, tags });
      setMoments((prev) => [toMoment(created), ...prev]);
    } catch {
      const newMoment: Moment = {
        id: Date.now().toString(),
        username: user.username,
        rank: user.rank,
        rankColor: getRankColor(user.rank),
        content,
        score,
        type,
        likes: 0,
        comments: 0,
        dislikes: 0,
        saves: 0,
        tags: tags ?? [],
        timeAgo: "just now",
        liked: false,
        disliked: false,
        saved: false,
        initials: user.username.substring(0, 2),
        avatarColor: "#1a3c2a",
      };
      setMoments((prev) => [newMoment, ...prev]);
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    // Optimistically remove from open list
    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    try {
      const accepted = await api.post<ApiChallenge>(`/challenges/${challengeId}/accept`);
      // Add to active (accepted) list
      setAcceptedChallenges((prev) => [toChallenge(accepted), ...prev]);
    } catch {
      // Re-fetch open challenges if it failed
      try {
        const refreshed = await api.get<ApiChallenge[]>("/challenges");
        setChallenges(refreshed.map(toChallenge));
      } catch { /* keep optimistic */ }
    }
  };

  const postChallenge = async (score: number, stake: number) => {
    try {
      const created = await api.post<ApiChallenge>("/challenges", { postedScore: score, stake });
      setMyActiveChallenges((prev) => [toChallenge(created), ...prev]);
    } catch {
      const newChallenge: Challenge = {
        id: Date.now().toString(),
        username: user.username,
        rank: user.rank,
        rankColor: getRankColor(user.rank),
        postedScore: score,
        stake,
        timeAgo: "just now",
        isPro: user.isPro,
        status: "open",
        initials: user.username.substring(0, 2),
        avatarColor: "#1a3c2a",
        isOwn: true,
      };
      setMyActiveChallenges((prev) => [newChallenge, ...prev]);
    }
  };

  const deleteChallenge = async (challengeId: string) => {
    setMyActiveChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    try {
      await api.delete(`/challenges/${challengeId}`);
    } catch {
      // If delete fails, re-fetch to restore
      const refreshed = await api.get<ApiChallenge[]>("/challenges/my");
      setMyActiveChallenges(refreshed.map(toChallenge));
    }
  };

  const completeChallenge = async (challengeId: string, result: "won" | "lost") => {
    try {
      const completed = await api.post<ApiChallenge>(`/challenges/${challengeId}/complete`, { result });
      setAcceptedChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setCompletedChallenges((prev) => [toChallenge(completed), ...prev]);
      const updatedUser = await api.get<ApiUser>("/users/me");
      setUser(toUser(updatedUser));
    } catch { /* ignore */ }
  };

  const setUserPro = async (isPro: boolean) => {
    setUser((prev) => ({ ...prev, isPro }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", { isPro });
      setUser(toUser(updated));
    } catch { /* keep optimistic */ }
  };

  const updatePaymentInfo = async (provider: string, handle: string) => {
    setUser((prev) => ({ ...prev, paymentProvider: provider, paymentHandle: handle }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", { paymentProvider: provider, paymentHandle: handle });
      setUser(toUser(updated));
    } catch { /* keep optimistic */ }
  };

  const joinLeague = async (leagueId: string) => {
    try {
      const updated = await api.post<ApiLeague>(`/leagues/${leagueId}/join`);
      setLeagues((prev) => prev.map((l) => (l.id === leagueId ? toLeague(updated) : l)));
    } catch { /* ignore */ }
  };

  const sendFriendRequest = async (userId: number) => {
    await api.post(`/friends/${userId}/request`);
  };

  const acceptFriendRequest = async (userId: number) => {
    await api.post(`/friends/${userId}/accept`);
  };

  const removeFriend = async (userId: number) => {
    await api.delete(`/friends/${userId}`);
  };

  return (
    <AppContext.Provider value={{
      user, games, challenges, myActiveChallenges, acceptedChallenges, completedChallenges,
      moments, leagues, loading,
      logGame, toggleLikeMoment, toggleDislikeMoment, saveMoment, unsaveMoment, postMoment,
      acceptChallenge, postChallenge, deleteChallenge, completeChallenge,
      setUserPro, updatePaymentInfo, joinLeague, refreshAll,
      sendFriendRequest, acceptFriendRequest, removeFriend,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
