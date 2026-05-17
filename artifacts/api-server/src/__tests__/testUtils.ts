import { vi } from "vitest";

export const TEST_USER_ID = 1;
export const TEST_AUTH_ID = "test-auth-uuid-0001";

export const MOCK_USER = {
  id: TEST_USER_ID,
  auth_id: TEST_AUTH_ID,
  username: "STRIKER_AC",
  name: "Alex Chen",
  rank: "Legend",
  level: 42,
  xp: 12450,
  xp_to_next: 15000,
  is_pro: false,
  career_avg: 218,
  high_game: 278,
  total_games: 12,
  team: "Strike Force",
  rating: 1842,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const MOCK_GAME = {
  id: 10,
  user_id: TEST_USER_ID,
  score: 245,
  date: "2024-06-15",
  alley: "Thunder Lanes",
  oil_pattern: "House Shot",
  ball_used: "Storm Hy-Road",
  notes: "Good series",
  verified: false,
  created_at: "2024-06-15T20:00:00Z",
};

export const MOCK_CHALLENGE = {
  id: 20,
  user_id: 2,
  username: "KING_PINS",
  rank: "Kingpin",
  rank_color: "#ff6b35",
  posted_score: 267,
  stake: 50,
  status: "open",
  initials: "KI",
  avatar_color: "#3a1a0a",
  is_pro: true,
  created_at: "2024-06-15T18:00:00Z",
  updated_at: "2024-06-15T18:00:00Z",
};

export const MOCK_MOMENT = {
  id: 30,
  user_id: 2,
  username: "KING_PINS",
  rank: "Kingpin",
  rank_color: "#ff6b35",
  content: "Shot a 289 tonight!",
  score: 289,
  type: "game",
  likes: 5,
  comments: 2,
  initials: "KI",
  avatar_color: "#3a1a0a",
  created_at: "2024-06-15T20:00:00Z",
};

export const MOCK_LEAGUE = {
  id: 40,
  name: "Thunder Alley Pro",
  description: "Competitive league for advanced bowlers.",
  members: 24,
  type: "public",
  level: "ADVANCED",
  avg_score: 215,
  weekly_challenge: "Best 3-game series",
  created_at: "2024-01-01T00:00:00Z",
};

type ChainResult<T = unknown> = { data: T; error: null } | { data: null; error: { message: string } };

export function createChain<T = unknown>(
  listResult: ChainResult<T[]> = { data: [] as T[], error: null },
  singleResult: ChainResult<T> = { data: null as unknown as T, error: null }
) {
  let _singleResult = singleResult;
  let _listResult = listResult;

  const p = Promise.resolve(_listResult);

  const chain = Object.assign(p, {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(_singleResult)),
    maybeSingle: vi.fn(() => Promise.resolve(_singleResult)),
  });

  return {
    chain,
    setSingleResult: (r: ChainResult<T>) => { _singleResult = r; },
    setListResult: (r: ChainResult<T[]>) => { _listResult = r; },
  };
}
