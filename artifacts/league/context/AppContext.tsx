import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";

// ── Rank system (BSR-based) ───────────────────────────────────────────────────
// Gutter <1000 | Spare 1000-1199 | Strike 1200-1399 |
// Turkey 1400-1599 | Perfect 1600-1799 | Legend 1800+

export type Rank =
  | "Gutter" | "Spare" | "Strike" | "Turkey" | "Perfect" | "Legend";

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
  bsr: number;
  wins: number;
  losses: number;
  // Bowling specs
  revRate?: number | null;
  ballSpeed?: number | null;
  axisTilt?: number | null;
  axisRotation?: number | null;
  papOver?: string | null;
  papUp?: string | null;
  releaseStyle?: string | null;
  gripStyle?: string | null;
  dominantHand?: string | null;
  // Home alley
  homeAlleyName?: string | null;
  homeAlleyLat?: number | null;
  homeAlleyLng?: number | null;
  homeAlleyOsmId?: string | null;
}

export interface AlleyPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  osmId: string;
  distanceKm?: number | null;
}

export interface Game {
  id: string;
  score: number;
  date: string;
  alley: string;
  oilPattern: string;
  ballUsed: string;
  ballId?: number | null;
  notes: string;
  verified: boolean;
  frames?: FrameData[] | null;
  scorecardImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  capturedAt?: string | null;
  entryMethod?: string | null;
}

export interface FrameData {
  ball1: number | null;
  ball2: number | null;
  ball3: number | null;
}

export interface Ball {
  id: string;
  name: string;
  brand?: string | null;
  weight?: number | null;
  color?: string | null;
  coverstock?: string | null;
  core?: string | null;
  drillingLayout?: string | null;
  span?: string | null;
  pitch?: string | null;
  surface?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Challenge {
  id: string;
  username: string;
  rank: Rank;
  rankColor: string;
  postedScore: number;
  posterBsr?: number;
  acceptorBsr?: number;
  acceptorFinalScore?: number;
  notes?: string;
  timeAgo: string;
  isPro: boolean;
  status: "open" | "active" | "completed" | "cancelled";
  initials: string;
  avatarColor: string;
  isOwn?: boolean;
  progress?: number;
  description?: string;
  acceptorId?: number;
  acceptorUsername?: string;
  winnerId?: number;
  completedAt?: string;
  result?: "won" | "lost";
  bsrChange?: number;
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
  userReaction?: string | null;
  initials: string;
  avatarColor: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  leagueId?: number | null;
  createdAt?: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "reaction" | "share";
  fromUsername: string;
  fromInitials: string;
  fromAvatarColor: string;
  momentId?: string;
  momentPreview?: string;
  emoji?: string;
  message?: string;
  read: boolean;
  timeAgo: string;
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
  bsr: number;
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
  bsr: number;
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
  createdBy?: number | null;
  myRole?: "admin" | "member" | null;
}

export interface LeagueMember {
  userId: number;
  role: "admin" | "member";
  status: string;
  joinedAt: string;
  username: string;
  name: string;
  rank: string;
  careerAvg: number;
  highGame: number;
}

export interface LeagueAnnouncement {
  id: number;
  leagueId: number;
  authorId: number;
  username: string;
  rank: string;
  content: string;
  createdAt: string;
}

const RANK_COLORS: Record<Rank, string> = {
  Gutter:  "#a0a0a0",
  Spare:   "#a8d8a8",
  Strike:  "#ffffff",
  Turkey:  "#f5c842",
  Perfect: "#60c8ff",
  Legend:  "#ff5f1f",
};

export function getRankColor(rank: Rank | string): string {
  return RANK_COLORS[rank as Rank] ?? "#a0a0a0";
}

const FALLBACK_USER: UserProfile = {
  name: "Bowler", username: "BOWLER", rank: "Strike",
  level: 1, xp: 0, xpToNext: 1000, isPro: false,
  careerAvg: 0, highGame: 0, totalGames: 0, team: "Solo",
  bsr: 1200, wins: 0, losses: 0,
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
  postMoment: (content: string, type: Moment["type"], score?: number, tags?: string[], mediaUrl?: string | null, mediaType?: string | null, leagueId?: number | null) => Promise<void>;
  updateCommentCount: (momentId: string, delta: 1 | -1) => void;
  createLeague: (input: { name: string; description: string; type: "public" | "private"; level: string; weeklyChallenge?: string }) => Promise<League>;
  leaveLeague: (leagueId: string) => Promise<void>;
  balls: Ball[];
  createBall: (input: Partial<Ball> & { name: string }) => Promise<Ball>;
  updateBall: (id: string, patch: Partial<Ball>) => Promise<void>;
  deleteBall: (id: string) => Promise<void>;
  refreshBalls: () => Promise<void>;
  acceptChallenge: (challengeId: string) => void;
  postChallenge: (score: number, notes?: string) => void;
  deleteChallenge: (challengeId: string) => Promise<void>;
  completeChallenge: (challengeId: string, acceptorScore: number) => Promise<{ result: "won" | "lost"; bsrChange: number } | null>;
  setUserPro: (isPro: boolean) => void;
  updateSpecs: (specs: Partial<Pick<UserProfile, "revRate"|"ballSpeed"|"axisTilt"|"axisRotation"|"papOver"|"papUp"|"releaseStyle"|"gripStyle"|"dominantHand">>) => Promise<void>;
  setHomeAlley: (alley: AlleyPlace | null) => Promise<void>;
  joinLeague: (leagueId: string) => void;
  searchLeagues: (q: string, type?: "all" | "public" | "private") => Promise<void>;
  refreshAll: () => Promise<void>;
  sendFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
  inbox: Notification[];
  inboxCount: number;
  fetchInbox: () => Promise<void>;
  markInboxRead: () => Promise<void>;
  reactToMoment: (momentId: string, emoji: string | null) => Promise<void>;
  shareMoment: (momentId: string, userIds: number[], message?: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

type ApiGame = {
  id: number; score: number; date: string; alley: string;
  oilPattern: string; ballUsed: string; notes: string; verified: boolean;
};
type ApiChallenge = {
  id: number; username: string; rank: string; rankColor: string;
  postedScore: number; posterBsr?: number; acceptorBsr?: number;
  acceptorFinalScore?: number; notes?: string;
  timeAgo: string; isPro: boolean;
  status: string; initials: string; avatarColor: string;
  acceptorId?: number | null;
  acceptorUsername?: string | null;
  winnerId?: number | null;
  completedAt?: string | null;
  result?: "won" | "lost";
  bsrChange?: number;
};
type ApiMoment = {
  id: number; userId?: number; username: string; rank: string; rankColor: string;
  content: string; score?: number | null; type: string;
  likes: number; comments: number; dislikes?: number; saves?: number; tags?: string[];
  timeAgo: string; liked: boolean; disliked?: boolean; saved?: boolean;
  userReaction?: string | null;
  initials: string; avatarColor: string;
  mediaUrl?: string | null; mediaType?: string | null;
  createdAt?: string;
};
type ApiBall = {
  id: string; name: string; brand?: string | null; weight?: number | null;
  color?: string | null; coverstock?: string | null; core?: string | null;
  drillingLayout?: string | null; span?: string | null; pitch?: string | null;
  surface?: string | null; notes?: string | null; imageUrl?: string | null;
  isActive: boolean; createdAt?: string;
};
type ApiNotification = {
  id: number; type: string;
  fromUsername: string; fromInitials: string; fromAvatarColor: string;
  momentId?: number; momentPreview?: string;
  emoji?: string; message?: string; read: boolean;
  timeAgo: string; createdAt?: string;
};
type ApiLeague = {
  id: number; name: string; description: string; members: number;
  type: string; level: string; avgScore: number;
  weeklyChallenge?: string | null; joined: boolean;
  createdBy?: number | null; myRole?: string | null;
};
type ApiUser = {
  id: number; name: string; username: string; rank: string;
  level: number; xp: number; xpToNext: number; isPro: boolean;
  careerAvg: number; highGame: number; totalGames: number;
  team: string; bsr: number; wins: number; losses: number;
  revRate?: number | null;
  ballSpeed?: number | null;
  axisTilt?: number | null;
  axisRotation?: number | null;
  papOver?: string | null;
  papUp?: string | null;
  releaseStyle?: string | null;
  gripStyle?: string | null;
  dominantHand?: string | null;
  homeAlleyName?: string | null;
  homeAlleyLat?: number | null;
  homeAlleyLng?: number | null;
  homeAlleyOsmId?: string | null;
};

function toGame(g: ApiGame): Game { return { ...g, id: String(g.id) }; }
function toChallenge(c: ApiChallenge): Challenge {
  return {
    id:                 String(c.id),
    username:           c.username,
    rank:               c.rank as Rank,
    rankColor:          c.rankColor,
    postedScore:        c.postedScore,
    posterBsr:          c.posterBsr ?? undefined,
    acceptorBsr:        c.acceptorBsr ?? undefined,
    acceptorFinalScore: c.acceptorFinalScore ?? undefined,
    notes:              c.notes ?? undefined,
    timeAgo:            c.timeAgo,
    isPro:              c.isPro,
    status:             c.status as Challenge["status"],
    initials:           c.initials,
    avatarColor:        c.avatarColor,
    acceptorId:         c.acceptorId ?? undefined,
    acceptorUsername:   c.acceptorUsername ?? undefined,
    winnerId:           c.winnerId ?? undefined,
    completedAt:        c.completedAt ?? undefined,
    result:             c.result,
    bsrChange:          c.bsrChange,
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
    userReaction: m.userReaction ?? null,
    mediaUrl: m.mediaUrl ?? null,
    mediaType: m.mediaType ?? null,
  };
}
function toBall(b: ApiBall): Ball {
  return { ...b, id: String(b.id) };
}
function toNotification(n: ApiNotification): Notification {
  return {
    id: String(n.id),
    type: n.type as Notification["type"],
    fromUsername: n.fromUsername,
    fromInitials: n.fromInitials,
    fromAvatarColor: n.fromAvatarColor,
    momentId: n.momentId ? String(n.momentId) : undefined,
    momentPreview: n.momentPreview,
    emoji: n.emoji,
    message: n.message,
    read: n.read,
    timeAgo: n.timeAgo,
    createdAt: n.createdAt,
  };
}
function toLeague(l: ApiLeague): League {
  return {
    ...l,
    id: String(l.id),
    type: l.type as League["type"],
    weeklyChallenge: l.weeklyChallenge ?? undefined,
    createdBy: l.createdBy ?? null,
    myRole: (l.myRole as League["myRole"]) ?? null,
  };
}
function toUser(u: ApiUser): UserProfile {
  return {
    ...u,
    rank:         u.rank as Rank,
    bsr:          u.bsr ?? 1200,
    wins:         u.wins ?? 0,
    losses:       u.losses ?? 0,
    revRate:      u.revRate ?? null,
    ballSpeed:    u.ballSpeed ?? null,
    axisTilt:     u.axisTilt ?? null,
    axisRotation: u.axisRotation ?? null,
    papOver:      u.papOver ?? null,
    papUp:        u.papUp ?? null,
    releaseStyle: u.releaseStyle ?? null,
    gripStyle:    u.gripStyle ?? null,
    dominantHand: u.dominantHand ?? null,
    homeAlleyName:  u.homeAlleyName ?? null,
    homeAlleyLat:   u.homeAlleyLat ?? null,
    homeAlleyLng:   u.homeAlleyLng ?? null,
    homeAlleyOsmId: u.homeAlleyOsmId ?? null,
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
  const [balls, setBalls] = useState<Ball[]>([]);
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchInbox = async () => {
    try {
      const res = await api.get<{ notifications: ApiNotification[]; unreadCount: number }>("/inbox");
      setInbox(res.notifications.map(toNotification));
      setInboxCount(res.unreadCount);
    } catch { /* keep current */ }
  };

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
    fetchInbox();
    refreshBalls();
    setupRealtime();
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  function setupRealtime() {
    // Guard against React StrictMode double-mount: remove any existing channel
    // with this topic before subscribing, otherwise Supabase throws.
    const existing = supabase.getChannels().find((c) => c.topic === "realtime:moments-realtime");
    if (existing) supabase.removeChannel(existing);

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
          liked: false, disliked: false, saved: false,
          initials: raw.initials ?? raw.username.slice(0, 2),
          avatarColor: raw.avatar_color ?? raw.avatarColor ?? "#1a3c2a",
          mediaUrl: (raw as { media_url?: string | null; mediaUrl?: string | null }).media_url
            ?? (raw as { mediaUrl?: string | null }).mediaUrl ?? null,
          mediaType: (raw as { media_type?: string | null; mediaType?: string | null }).media_type
            ?? (raw as { mediaType?: string | null }).mediaType ?? null,
          createdAt: raw.created_at,
        };
        setMoments((prev) => {
          // deduplicate: Realtime fires even for our own inserts
          if (prev.some((m) => m.id === String(raw.id))) return prev;
          return [newMoment, ...prev];
        });
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
    } catch { /* keep fallback state */ }
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

  const updateCommentCount = (momentId: string, delta: 1 | -1) => {
    setMoments((prev) =>
      prev.map((m) => m.id === momentId ? { ...m, comments: Math.max(0, m.comments + delta) } : m)
    );
  };

  const postMoment = async (
    content: string,
    type: Moment["type"],
    score?: number,
    tags?: string[],
    mediaUrl?: string | null,
    mediaType?: string | null,
    leagueId?: number | null,
  ) => {
    try {
      const created = await api.post<ApiMoment>("/moments", { content, type, score, tags, mediaUrl, mediaType, leagueId });
      const moment = toMoment(created);
      // Add to list only if not already there (Realtime may have fired first)
      setMoments((prev) => prev.some((m) => m.id === moment.id) ? prev : [moment, ...prev]);
    } catch {
      const newMoment: Moment = {
        id: Date.now().toString(),
        username: user.username,
        rank: user.rank,
        rankColor: getRankColor(user.rank),
        content, score, type,
        likes: 0, comments: 0, dislikes: 0, saves: 0,
        tags: tags ?? [],
        timeAgo: "just now",
        liked: false, disliked: false, saved: false,
        initials: user.username.substring(0, 2),
        avatarColor: "#1a3c2a",
        mediaUrl: mediaUrl ?? null,
        mediaType: mediaType ?? null,
      };
      setMoments((prev) => [newMoment, ...prev]);
    }
  };

  const refreshBalls = async () => {
    try {
      const res = await api.get<ApiBall[]>("/balls");
      setBalls(res.map(toBall));
    } catch { /* ignore */ }
  };

  const createBall = async (input: Partial<Ball> & { name: string }): Promise<Ball> => {
    const created = await api.post<ApiBall>("/balls", input);
    const ball = toBall(created);
    setBalls((prev) => [ball, ...prev]);
    return ball;
  };

  const updateBall = async (id: string, patch: Partial<Ball>) => {
    setBalls((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      const updated = await api.patch<ApiBall>(`/balls/${id}`, patch);
      setBalls((prev) => prev.map((b) => (b.id === id ? toBall(updated) : b)));
    } catch { /* keep optimistic */ }
  };

  const deleteBall = async (id: string) => {
    setBalls((prev) => prev.filter((b) => b.id !== id));
    try { await api.delete(`/balls/${id}`); } catch { /* ignore */ }
  };

  const acceptChallenge = async (challengeId: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    try {
      const accepted = await api.post<ApiChallenge>(`/challenges/${challengeId}/accept`);
      setAcceptedChallenges((prev) => [toChallenge(accepted), ...prev]);
    } catch {
      try {
        const refreshed = await api.get<ApiChallenge[]>("/challenges");
        setChallenges(refreshed.map(toChallenge));
      } catch { /* keep optimistic */ }
    }
  };

  const postChallenge = async (score: number, notes?: string) => {
    try {
      const created = await api.post<ApiChallenge>("/challenges", { postedScore: score, notes });
      setMyActiveChallenges((prev) => [toChallenge(created), ...prev]);
    } catch {
      const newChallenge: Challenge = {
        id: Date.now().toString(),
        username: user.username,
        rank: user.rank,
        rankColor: getRankColor(user.rank),
        postedScore: score,
        posterBsr: user.bsr,
        notes,
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
      const refreshed = await api.get<ApiChallenge[]>("/challenges/my");
      setMyActiveChallenges(refreshed.map(toChallenge));
    }
  };

  const completeChallenge = async (challengeId: string, acceptorScore: number) => {
    try {
      const completed = await api.post<ApiChallenge & { result: "won" | "lost"; bsrChange: number }>(
        `/challenges/${challengeId}/complete`,
        { acceptorFinalScore: acceptorScore },
      );
      setAcceptedChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setCompletedChallenges((prev) => [toChallenge(completed), ...prev]);
      const updatedUser = await api.get<ApiUser>("/users/me");
      setUser(toUser(updatedUser));
      return { result: completed.result, bsrChange: completed.bsrChange };
    } catch { return null; }
  };

  const setUserPro = async (isPro: boolean) => {
    setUser((prev) => ({ ...prev, isPro }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", { isPro });
      setUser(toUser(updated));
    } catch { /* keep optimistic */ }
  };

  const updateSpecs = async (specs: Partial<Pick<UserProfile, "revRate"|"ballSpeed"|"axisTilt"|"axisRotation"|"papOver"|"papUp"|"releaseStyle"|"gripStyle"|"dominantHand">>) => {
    setUser((prev) => ({ ...prev, ...specs }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", specs);
      setUser(toUser(updated));
    } catch { /* keep optimistic */ }
  };

  const setHomeAlley = async (alley: AlleyPlace | null) => {
    const patch = {
      homeAlleyName:  alley?.name ?? null,
      homeAlleyLat:   alley?.lat ?? null,
      homeAlleyLng:   alley?.lng ?? null,
      homeAlleyOsmId: alley?.osmId ?? null,
    };
    setUser((prev) => ({ ...prev, ...patch }));
    try {
      const updated = await api.patch<ApiUser>("/users/me", patch);
      setUser(toUser(updated));
    } catch { /* keep optimistic */ }
  };

  const joinLeague = async (leagueId: string) => {
    try {
      const updated = await api.post<ApiLeague>(`/leagues/${leagueId}/join`);
      setLeagues((prev) => prev.map((l) => (l.id === leagueId ? toLeague(updated) : l)));
    } catch { /* ignore */ }
  };

  const createLeague = async (input: { name: string; description: string; type: "public" | "private"; level: string; weeklyChallenge?: string }): Promise<League> => {
    const created = await api.post<ApiLeague>("/leagues", input);
    const league = toLeague(created);
    setLeagues((prev) => [league, ...prev]);
    return league;
  };

  const leaveLeague = async (leagueId: string): Promise<void> => {
    await api.delete(`/leagues/${leagueId}/leave`);
    setLeagues((prev) => prev.map((l) => l.id === leagueId ? { ...l, joined: false, myRole: null } : l));
  };

  const searchLeagues = async (q: string, type: "all" | "public" | "private" = "all") => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type !== "all") params.set("type", type);
    try {
      const res = await api.get<ApiLeague[]>(`/leagues${params.toString() ? `?${params}` : ""}`);
      setLeagues(res.map(toLeague));
    } catch { /* keep current */ }
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

  const markInboxRead = async () => {
    setInboxCount(0);
    setInbox((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await api.patch("/inbox/read", {}); } catch { /* keep optimistic */ }
  };

  const reactToMoment = async (momentId: string, emoji: string | null) => {
    setMoments((prev) =>
      prev.map((m) => m.id === momentId ? { ...m, userReaction: emoji } : m)
    );
    try {
      if (emoji === null) {
        await api.delete(`/moments/${momentId}/react`);
      } else {
        await api.post(`/moments/${momentId}/react`, { emoji });
      }
    } catch { /* keep optimistic */ }
  };

  const shareMoment = async (momentId: string, userIds: number[], message?: string) => {
    try {
      await api.post(`/moments/${momentId}/share`, { userIds, message });
    } catch { /* ignore */ }
  };

  return (
    <AppContext.Provider value={{
      user, games, challenges, myActiveChallenges, acceptedChallenges, completedChallenges,
      moments, leagues, loading,
      logGame, toggleLikeMoment, toggleDislikeMoment, saveMoment, unsaveMoment, postMoment,
      balls, createBall, updateBall, deleteBall, refreshBalls,
      acceptChallenge, postChallenge, deleteChallenge, completeChallenge,
      setUserPro, updateSpecs, setHomeAlley,
      joinLeague, createLeague, leaveLeague, searchLeagues, refreshAll,
      updateCommentCount,
      sendFriendRequest, acceptFriendRequest, removeFriend,
      inbox, inboxCount, fetchInbox, markInboxRead, reactToMoment, shareMoment,
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
