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
  id: number;
  username: string;
  name: string;
  rank: Rank;
  level: number;
  xp: number;
  xpToNext: number;
  isPro: boolean;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  team: string;
  rating: number; // BSR score
  wins: number;
  losses: number;
  // Bowling specs
  revRate?: number | null;
  ballSpeed?: number | null;
  axisTilt?: number | null;
  axisRotation?: number | null;
  dominantHand?: string | null;
  gripStyle?: string | null;
  releaseStyle?: string | null;
  homeAlleyName?: string | null;
}

export interface FrameData {
  ball1: number | null;
  ball2: number | null;
  ball3?: number | null;
  score?: number | null;
  isStrike?: boolean;
  isSpare?: boolean;
  isSplit?: boolean;
}

export interface Game {
  id: string;
  userId: number;
  score: number;
  date: string;
  alley: string;
  oilPattern: string;
  ballUsed: string;
  notes: string;
  verified: boolean;
  frames?: FrameData[] | null;
  entryMethod?: "quick" | "frames" | "photo";
}

export interface Ball {
  id: string;
  userId: number;
  name: string;
  brand: string;
  weight: number;
  color?: string;
  coverstock?: string;
  core?: string;
  surface?: string;
  drillingLayout?: string;
  notes?: string;
  isActive: boolean;
}

export interface Challenge {
  id: string;
  userId: number;
  username: string;
  name?: string;
  rank: Rank;
  rankColor: string;
  postedScore: number;
  stake: number;
  status: "open" | "active" | "completed" | "cancelled";
  initials: string;
  avatarColor: string;
  isPro: boolean;
  createdAt: string;
  notes?: string;
  acceptedByUserId?: number | null;
  acceptedByUsername?: string | null;
  acceptedScore?: number | null;
  winnerUserId?: number | null;
}

export interface MomentComment {
  id: string;
  momentId: string;
  userId: number;
  username: string;
  initials: string;
  avatarColor: string;
  rank: Rank;
  content: string;
  createdAt: string;
}

export interface Moment {
  id: string;
  userId: number;
  username: string;
  name?: string;
  rank: Rank;
  rankColor: string;
  content: string;
  score?: number | null;
  type: "game" | "strike" | "advice" | "challenge" | "gear";
  likes: number;
  dislikes: number;
  commentsCount: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isSaved?: boolean;
  initials: string;
  avatarColor: string;
  createdAt: string;
  tags: string[];
}

export interface League {
  id: string;
  name: string;
  description: string;
  members: number;
  type: "public" | "private";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  avgScore: number;
  weeklyChallenge: string;
  dayOfWeek?: string;
  time?: string;
  location?: string;
  prizeFund?: string;
  isJoined?: boolean;
}

export interface Friend {
  id: number;
  username: string;
  name: string;
  rank: Rank;
  careerAvg: number;
  highGame: number;
  level: number;
  team: string;
  rating: number;
  avatarColor: string;
  initials: string;
  status: "friend" | "incoming_request" | "outgoing_request" | "none";
}
