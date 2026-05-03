import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

export type Rank =
  | "Rookie"
  | "Amateur"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Elite"
  | "Diamond IV"
  | "Diamond III"
  | "Diamond II"
  | "Diamond I"
  | "Platinum II"
  | "Platinum I"
  | "Legend"
  | "Kingpin";

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
  status: "open" | "active" | "completed";
  initials: string;
  avatarColor: string;
  isOwn?: boolean;
  progress?: number;
  matchesRequired?: number;
  matchesPlayed?: number;
  description?: string;
}

export interface Moment {
  id: string;
  username: string;
  rank: Rank;
  rankColor: string;
  content: string;
  score?: number;
  type: "strike" | "game" | "challenge" | "advice";
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
  initials: string;
  avatarColor: string;
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
  Rookie: "#a0a0a0",
  Amateur: "#a0a0a0",
  Intermediate: "#a8c870",
  Advanced: "#a8c870",
  Expert: "#f5c842",
  Elite: "#f5c842",
  "Diamond IV": "#60c8ff",
  "Diamond III": "#60c8ff",
  "Diamond II": "#60c8ff",
  "Diamond I": "#60c8ff",
  "Platinum II": "#c8a8e8",
  "Platinum I": "#c8a8e8",
  Legend: "#9fe870",
  Kingpin: "#ff6b35",
};

export function getRankColor(rank: Rank): string {
  return RANK_COLORS[rank] ?? "#a0a0a0";
}

const FALLBACK_USER: UserProfile = {
  name: "Alex Chen",
  username: "STRIKER_AC",
  rank: "Legend",
  level: 42,
  xp: 12450,
  xpToNext: 15000,
  isPro: false,
  careerAvg: 218,
  highGame: 300,
  totalGames: 847,
  team: "Strike Force",
  rating: 1842,
};

interface AppContextValue {
  user: UserProfile;
  games: Game[];
  challenges: Challenge[];
  myActiveChallenges: Challenge[];
  moments: Moment[];
  leagues: League[];
  loading: boolean;
  logGame: (game: Omit<Game, "id">) => Promise<void>;
  toggleLikeMoment: (momentId: string) => void;
  acceptChallenge: (challengeId: string) => void;
  postChallenge: (score: number, stake: number) => void;
  setUserPro: (isPro: boolean) => void;
  joinLeague: (leagueId: string) => void;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

type ApiGame = {
  id: number;
  score: number;
  date: string;
  alley: string;
  oilPattern: string;
  ballUsed: string;
  notes: string;
  verified: boolean;
};

type ApiChallenge = {
  id: number;
  username: string;
  rank: string;
  rankColor: string;
  postedScore: number;
  stake: number;
  timeAgo: string;
  isPro: boolean;
  status: string;
  initials: string;
  avatarColor: string;
};

type ApiMoment = {
  id: number;
  username: string;
  rank: string;
  rankColor: string;
  content: string;
  score?: number | null;
  type: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
  initials: string;
  avatarColor: string;
};

type ApiLeague = {
  id: number;
  name: string;
  description: string;
  members: number;
  type: string;
  level: string;
  avgScore: number;
  weeklyChallenge?: string | null;
  joined: boolean;
};

type ApiUser = {
  id: number;
  name: string;
  username: string;
  rank: string;
  level: number;
  xp: number;
  xpToNext: number;
  isPro: boolean;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  team: string;
  rating: number;
};

function toGame(g: ApiGame): Game {
  return { ...g, id: String(g.id) };
}

function toChallenge(c: ApiChallenge): Challenge {
  return {
    ...c,
    id: String(c.id),
    rank: c.rank as Rank,
    status: c.status as Challenge["status"],
  };
}

function toMoment(m: ApiMoment): Moment {
  return {
    ...m,
    id: String(m.id),
    rank: m.rank as Rank,
    score: m.score ?? undefined,
    type: m.type as Moment["type"],
  };
}

function toLeague(l: ApiLeague): League {
  return {
    ...l,
    id: String(l.id),
    type: l.type as League["type"],
    weeklyChallenge: l.weeklyChallenge ?? undefined,
  };
}

function toUser(u: ApiUser): UserProfile {
  return { ...u, rank: u.rank as Rank };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(FALLBACK_USER);
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myActiveChallenges, setMyActiveChallenges] = useState<Challenge[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
  }, []);

  async function refreshAll() {
    try {
      const [userRes, gamesRes, challengesRes, myChallRes, momentsRes, leaguesRes] =
        await Promise.allSettled([
          api.get<ApiUser>("/users/me"),
          api.get<ApiGame[]>("/games"),
          api.get<ApiChallenge[]>("/challenges"),
          api.get<ApiChallenge[]>("/challenges/my"),
          api.get<ApiMoment[]>("/moments"),
          api.get<ApiLeague[]>("/leagues"),
        ]);

      if (userRes.status === "fulfilled") setUser(toUser(userRes.value));
      if (gamesRes.status === "fulfilled") setGames(gamesRes.value.map(toGame));
      if (challengesRes.status === "fulfilled") setChallenges(challengesRes.value.map(toChallenge));
      if (myChallRes.status === "fulfilled") setMyActiveChallenges(myChallRes.value.map(toChallenge));
      if (momentsRes.status === "fulfilled") setMoments(momentsRes.value.map(toMoment));
      if (leaguesRes.status === "fulfilled") setLeagues(leaguesRes.value.map(toLeague));
    } catch {
      // silently keep fallback state
    }
  }

  const logGame = async (gameData: Omit<Game, "id">) => {
    const created = await api.post<ApiGame>("/games", gameData);
    const newGame = toGame(created);
    setGames((prev) => [newGame, ...prev]);

    const updatedUser = await api.get<ApiUser>("/users/me");
    setUser(toUser(updatedUser));
  };

  const toggleLikeMoment = async (momentId: string) => {
    const current = moments.find((m) => m.id === momentId);
    if (!current) return;

    try {
      let updated: ApiMoment;
      if (current.liked) {
        updated = await api.delete<ApiMoment>(`/moments/${momentId}/like`);
      } else {
        updated = await api.post<ApiMoment>(`/moments/${momentId}/like`);
      }
      setMoments((prev) =>
        prev.map((m) => (m.id === momentId ? toMoment(updated) : m))
      );
    } catch {
      // optimistic fallback
      setMoments((prev) =>
        prev.map((m) =>
          m.id === momentId
            ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 }
            : m
        )
      );
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    try {
      await api.post<ApiChallenge>(`/challenges/${challengeId}/accept`);
    } catch {
      // ignore
    }
    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
  };

  const postChallenge = async (score: number, stake: number) => {
    try {
      const created = await api.post<ApiChallenge>("/challenges", {
        postedScore: score,
        stake,
      });
      setMyActiveChallenges((prev) => [toChallenge(created), ...prev]);
    } catch {
      // fallback: add locally
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

  const setUserPro = async (isPro: boolean) => {
    setUser((prev) => ({ ...prev, isPro }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", { isPro });
      setUser(toUser(updated));
    } catch {
      // keep optimistic update
    }
  };

  const joinLeague = async (leagueId: string) => {
    try {
      const updated = await api.post<ApiLeague>(`/leagues/${leagueId}/join`);
      setLeagues((prev) =>
        prev.map((l) => (l.id === leagueId ? toLeague(updated) : l))
      );
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        games,
        challenges,
        myActiveChallenges,
        moments,
        leagues,
        loading,
        logGame,
        toggleLikeMoment,
        acceptChallenge,
        postChallenge,
        setUserPro,
        joinLeague,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
