import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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

const DEMO_USER: UserProfile = {
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

const DEMO_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    username: "STRIKER_44",
    rank: "Diamond IV",
    rankColor: "#60c8ff",
    postedScore: 278,
    stake: 50,
    timeAgo: "2h ago",
    isPro: false,
    status: "open",
    initials: "S4",
    avatarColor: "#2a3a5c",
  },
  {
    id: "c2",
    username: "KINGPIN_J",
    rank: "Platinum II",
    rankColor: "#c8a8e8",
    postedScore: 245,
    stake: 150,
    timeAgo: "4h ago",
    isPro: true,
    status: "open",
    initials: "KJ",
    avatarColor: "#3c2a5c",
  },
  {
    id: "c3",
    username: "LANE_KING",
    rank: "Legend",
    rankColor: "#9fe870",
    postedScore: 295,
    stake: 25,
    timeAgo: "5h ago",
    isPro: true,
    status: "open",
    initials: "LK",
    avatarColor: "#1a3c2a",
  },
  {
    id: "c4",
    username: "PINSEEKER",
    rank: "Diamond III",
    rankColor: "#60c8ff",
    postedScore: 261,
    stake: 75,
    timeAgo: "8h ago",
    isPro: false,
    status: "open",
    initials: "PS",
    avatarColor: "#3c1a2a",
  },
  {
    id: "c5",
    username: "ROLLMASTER",
    rank: "Expert",
    rankColor: "#f5c842",
    postedScore: 232,
    stake: 10,
    timeAgo: "12h ago",
    isPro: false,
    status: "open",
    initials: "RM",
    avatarColor: "#3c3a1a",
  },
];

const MY_ACTIVE_CHALLENGES: Challenge[] = [
  {
    id: "my1",
    username: "WEEKEND WARRIOR",
    rank: "Diamond IV",
    rankColor: "#60c8ff",
    postedScore: 265,
    stake: 20,
    timeAgo: "",
    isPro: false,
    status: "active",
    initials: "WW",
    avatarColor: "#1a2a3c",
    isOwn: true,
    progress: 0.5,
    matchesRequired: 10,
    matchesPlayed: 5,
    description: "5/10 MATCHES",
  },
  {
    id: "my2",
    username: "PERFECT SERIES",
    rank: "Legend",
    rankColor: "#9fe870",
    postedScore: 290,
    stake: 50,
    timeAgo: "",
    isPro: true,
    status: "active",
    initials: "PS",
    avatarColor: "#1a3c1a",
    isOwn: true,
    progress: 0.75,
    matchesRequired: 3,
    matchesPlayed: 2,
    description: "270+ AVG / 3 GAMES",
  },
];

const DEMO_MOMENTS: Moment[] = [
  {
    id: "m1",
    username: "PINMASTER",
    rank: "Diamond I",
    rankColor: "#60c8ff",
    content:
      "Back-to-back 290s this week on the house shot. The oil pattern has been perfect lately.",
    score: 290,
    type: "game",
    likes: 47,
    comments: 12,
    timeAgo: "1h ago",
    liked: false,
    initials: "PM",
    avatarColor: "#1a2a5c",
  },
  {
    id: "m2",
    username: "SPARE_QUEEN",
    rank: "Platinum I",
    rankColor: "#c8a8e8",
    content:
      "Any tips for a 7-10 split? I've been leaving it every third game and it's killing my average.",
    type: "advice",
    likes: 23,
    comments: 34,
    timeAgo: "3h ago",
    liked: true,
    initials: "SQ",
    avatarColor: "#3c1a4a",
  },
  {
    id: "m3",
    username: "HOOK_MASTER",
    rank: "Legend",
    rankColor: "#9fe870",
    content:
      "Finally cracked 300 in the Thursday night league. The Storm Phaze III was absolutely dialed in.",
    score: 300,
    type: "strike",
    likes: 234,
    comments: 67,
    timeAgo: "5h ago",
    liked: false,
    initials: "HM",
    avatarColor: "#1a3c1a",
  },
  {
    id: "m4",
    username: "CURVE_BALL",
    rank: "Expert",
    rankColor: "#f5c842",
    content:
      "Oil pattern on lanes 14-16 at Bowlero tonight was brutal. Anyone else struggle with the sport shot?",
    type: "advice",
    likes: 18,
    comments: 29,
    timeAgo: "7h ago",
    liked: false,
    initials: "CB",
    avatarColor: "#3c2a1a",
  },
  {
    id: "m5",
    username: "LANE_GHOST",
    rank: "Diamond II",
    rankColor: "#60c8ff",
    content:
      "Accepted a $50 challenge and bowled a 288. Easiest money I've made this month.",
    score: 288,
    type: "challenge",
    likes: 89,
    comments: 21,
    timeAgo: "10h ago",
    liked: false,
    initials: "LG",
    avatarColor: "#1a3c4a",
  },
];

const DEMO_LEAGUES: League[] = [
  {
    id: "l1",
    name: "Midnight Strikers",
    description: "Underground 3v3 circuit for elite nighttime bowlers",
    members: 124,
    type: "public",
    level: "ADVANCED",
    avgScore: 231,
    weeklyChallenge: "Highest single game wins $200",
  },
  {
    id: "l2",
    name: "Sunday Classics",
    description: "Weekend warriors competing for pride and prizes",
    members: 89,
    type: "public",
    level: "INTERMEDIATE",
    avgScore: 188,
    weeklyChallenge: "Best spare percentage this week",
  },
  {
    id: "l3",
    name: "Pro Circuit",
    description: "Invite-only league for ranked Diamond+ players",
    members: 32,
    type: "private",
    level: "EXPERT",
    avgScore: 267,
    weeklyChallenge: "First to 300 wins the pot",
  },
  {
    id: "l4",
    name: "Friday Night Lights",
    description: "Casual league with big energy and bigger scores",
    members: 156,
    type: "public",
    level: "BEGINNER",
    avgScore: 162,
    weeklyChallenge: "Most improved score from last week",
  },
];

const DEMO_GAMES: Game[] = [
  {
    id: "g1",
    score: 267,
    date: "2026-05-02",
    alley: "Bowlero Midtown",
    oilPattern: "House Shot",
    ballUsed: "Storm Phaze II",
    notes: "Great carry on the 7-pin all night",
    verified: true,
  },
  {
    id: "g2",
    score: 248,
    date: "2026-05-01",
    alley: "AMF Pro Bowl",
    oilPattern: "Sport Shot",
    ballUsed: "Motiv Trident",
    notes: "",
    verified: true,
  },
  {
    id: "g3",
    score: 291,
    date: "2026-04-29",
    alley: "Bowlero Midtown",
    oilPattern: "House Shot",
    ballUsed: "Storm Phaze II",
    notes: "Personal best session",
    verified: true,
  },
];

interface AppContextValue {
  user: UserProfile;
  games: Game[];
  challenges: Challenge[];
  myActiveChallenges: Challenge[];
  moments: Moment[];
  leagues: League[];
  logGame: (game: Omit<Game, "id">) => Promise<void>;
  toggleLikeMoment: (momentId: string) => void;
  acceptChallenge: (challengeId: string) => void;
  postChallenge: (score: number, stake: number) => void;
  setUserPro: (isPro: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "league_app_data";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEMO_USER);
  const [games, setGames] = useState<Game[]>(DEMO_GAMES);
  const [challenges, setChallenges] = useState<Challenge[]>(DEMO_CHALLENGES);
  const [myActiveChallenges, setMyActiveChallenges] =
    useState<Challenge[]>(MY_ACTIVE_CHALLENGES);
  const [moments, setMoments] = useState<Moment[]>(DEMO_MOMENTS);
  const [leagues] = useState<League[]>(DEMO_LEAGUES);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.user) setUser(data.user);
        if (data.games) setGames(data.games);
        if (data.moments) setMoments(data.moments);
      }
    } catch {}
  }

  async function saveData(
    updatedUser: UserProfile,
    updatedGames: Game[],
    updatedMoments: Moment[]
  ) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: updatedUser,
          games: updatedGames,
          moments: updatedMoments,
        })
      );
    } catch {}
  }

  const logGame = async (gameData: Omit<Game, "id">) => {
    const newGame: Game = {
      ...gameData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    };
    const updatedGames = [newGame, ...games];
    const totalScores = updatedGames.reduce((sum, g) => sum + g.score, 0);
    const newAvg = Math.round(totalScores / updatedGames.length);
    const newHigh = Math.max(user.highGame, newGame.score);
    const xpGained = Math.floor(newGame.score / 10);
    const newXp = user.xp + xpGained;
    const updatedUser = {
      ...user,
      careerAvg: newAvg,
      highGame: newHigh,
      totalGames: user.totalGames + 1,
      xp: newXp > user.xpToNext ? newXp - user.xpToNext : newXp,
      level: newXp > user.xpToNext ? user.level + 1 : user.level,
    };
    setGames(updatedGames);
    setUser(updatedUser);
    await saveData(updatedUser, updatedGames, moments);
  };

  const toggleLikeMoment = (momentId: string) => {
    setMoments((prev) =>
      prev.map((m) =>
        m.id === momentId
          ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 }
          : m
      )
    );
  };

  const acceptChallenge = (challengeId: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
  };

  const postChallenge = (score: number, stake: number) => {
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
  };

  const setUserPro = (isPro: boolean) => {
    const updatedUser = { ...user, isPro };
    setUser(updatedUser);
    saveData(updatedUser, games, moments);
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
        logGame,
        toggleLikeMoment,
        acceptChallenge,
        postChallenge,
        setUserPro,
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
