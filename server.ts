import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── In-Memory Store preloaded with rich seed data ──────────────────────────────
export const RANK_COLORS: Record<string, string> = {
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

let currentUser = {
  id: 1,
  username: "STRIKER_AC",
  name: "Alex Chen",
  rank: "Legend" as const,
  level: 42,
  xp: 12450,
  xpToNext: 15000,
  isPro: true,
  careerAvg: 218,
  highGame: 300,
  totalGames: 847,
  team: "Strike Force",
  rating: 1842,
  wins: 34,
  losses: 12,
  revRate: 420,
  ballSpeed: 16.8,
  axisTilt: 14,
  axisRotation: 55,
  dominantHand: "Right",
  gripStyle: "Fingertip",
  releaseStyle: "Cranker",
  homeAlleyName: "Bowlero Midtown Lanes",
};

let allUsers = [
  currentUser,
  { id: 2, username: "KING_PINS", name: "Marcus Williams", rank: "Kingpin" as const, level: 87, xp: 94200, xpToNext: 100000, isPro: true, careerAvg: 241, highGame: 300, totalGames: 1842, team: "Strike Force", rating: 2341, wins: 142, losses: 28, revRate: 480, ballSpeed: 17.5, axisTilt: 12, axisRotation: 60, dominantHand: "Right", gripStyle: "Fingertip", releaseStyle: "Power Stroker", homeAlleyName: "Sunset National Lanes" },
  { id: 3, username: "SPARE_QUEEN", name: "Jasmine Park", rank: "Legend" as const, level: 63, xp: 45800, xpToNext: 50000, isPro: true, careerAvg: 228, highGame: 299, totalGames: 1203, team: "Solo", rating: 1998, wins: 88, losses: 24, revRate: 360, ballSpeed: 15.4, axisTilt: 16, axisRotation: 45, dominantHand: "Right", gripStyle: "Fingertip", releaseStyle: "Stroker", homeAlleyName: "AMF Pro Bowl" },
  { id: 4, username: "HOOK_MASTER", name: "Leo Hook", rank: "Legend" as const, level: 48, xp: 13800, xpToNext: 15000, isPro: true, careerAvg: 235, highGame: 300, totalGames: 1287, team: "Midnight Strikers", rating: 1965, wins: 64, losses: 19, revRate: 510, ballSpeed: 18.1, axisTilt: 10, axisRotation: 65, dominantHand: "Left", gripStyle: "Two-Handed", releaseStyle: "Two-Handed", homeAlleyName: "Thunderbird Bowl" },
  { id: 5, username: "STRIKE_NOVA", name: "Priya Sharma", rank: "Platinum I" as const, level: 52, xp: 38100, xpToNext: 40000, isPro: true, careerAvg: 215, highGame: 295, totalGames: 1024, team: "Nova Crew", rating: 1876, wins: 51, losses: 22, revRate: 390, ballSpeed: 16.0, axisTilt: 15, axisRotation: 50, dominantHand: "Right", gripStyle: "Fingertip", releaseStyle: "Tweener", homeAlleyName: "Metro Super Lanes" },
  { id: 6, username: "GUTTER_KING", name: "Tyler Brooks", rank: "Diamond I" as const, level: 41, xp: 28400, xpToNext: 30000, isPro: false, careerAvg: 198, highGame: 289, totalGames: 847, team: "Solo", rating: 1654, wins: 39, losses: 31, revRate: 410, ballSpeed: 16.5, axisTilt: 18, axisRotation: 40, dominantHand: "Right", gripStyle: "Conventional", releaseStyle: "Tweener", homeAlleyName: "Oakridge Bowl" },
  { id: 7, username: "PINMASTER", name: "Ava Pierce", rank: "Diamond I" as const, level: 36, xp: 9800, xpToNext: 11000, isPro: false, careerAvg: 204, highGame: 291, totalGames: 508, team: "Friday Night Crew", rating: 1820, wins: 44, losses: 18, revRate: 340, ballSpeed: 15.0, axisTilt: 12, axisRotation: 45, dominantHand: "Right", gripStyle: "Fingertip", releaseStyle: "Stroker", homeAlleyName: "Bowlero Midtown Lanes" },
  { id: 8, username: "BOWL_MASTER", name: "Derek Johnson", rank: "Expert" as const, level: 29, xp: 14200, xpToNext: 20000, isPro: false, careerAvg: 182, highGame: 278, totalGames: 512, team: "Solo", rating: 1423, wins: 22, losses: 26, revRate: 320, ballSpeed: 14.8, axisTilt: 20, axisRotation: 35, dominantHand: "Right", gripStyle: "Conventional", releaseStyle: "Stroker", homeAlleyName: "Sunset National Lanes" },
];

let challenges = [
  {
    id: "ch-1",
    userId: 2,
    username: "KING_PINS",
    name: "Marcus Williams",
    rank: "Kingpin" as const,
    rankColor: RANK_COLORS["Kingpin"],
    postedScore: 267,
    stake: 50,
    status: "open" as const,
    initials: "MW",
    avatarColor: "#ff6b35",
    isPro: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    notes: "House shot tournament prep. High roll takes $50 stake!",
  },
  {
    id: "ch-2",
    userId: 3,
    username: "SPARE_QUEEN",
    name: "Jasmine Park",
    rank: "Legend" as const,
    rankColor: RANK_COLORS["Legend"],
    postedScore: 245,
    stake: 25,
    status: "open" as const,
    initials: "JP",
    avatarColor: "#9fe870",
    isPro: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    notes: "Clean game challenge! Beat my 245 without open frames.",
  },
  {
    id: "ch-3",
    userId: 6,
    username: "GUTTER_KING",
    name: "Tyler Brooks",
    rank: "Diamond I" as const,
    rankColor: RANK_COLORS["Diamond I"],
    postedScore: 231,
    stake: 100,
    status: "open" as const,
    initials: "TB",
    avatarColor: "#60c8ff",
    isPro: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    notes: "High roller stake! 1 game showdown on Sport Shot.",
  },
  {
    id: "ch-4",
    userId: 5,
    username: "STRIKE_NOVA",
    name: "Priya Sharma",
    rank: "Platinum I" as const,
    rankColor: RANK_COLORS["Platinum I"],
    postedScore: 258,
    stake: 75,
    status: "open" as const,
    initials: "PS",
    avatarColor: "#c8a8e8",
    isPro: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    notes: "Fresh oil match! Storm Phaze II in action.",
  },
  {
    id: "ch-5",
    userId: 1,
    username: "STRIKER_AC",
    name: "Alex Chen",
    rank: "Legend" as const,
    rankColor: RANK_COLORS["Legend"],
    postedScore: 268,
    stake: 30,
    status: "open" as const,
    initials: "AC",
    avatarColor: "#9fe870",
    isPro: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    notes: "Friday warm-up single. Who can top 268?",
  },
];

let moments = [
  {
    id: "mom-1",
    userId: 2,
    username: "KING_PINS",
    name: "Marcus Williams",
    rank: "Kingpin" as const,
    rankColor: RANK_COLORS["Kingpin"],
    content: "Just shot a 300 on the house shot! 12 strikes in a row, zero pocket misses. The Storm Phaze II was rolling pure tonight! #perfect300 #clean #stormnation",
    score: 300,
    type: "strike" as const,
    likes: 84,
    dislikes: 1,
    commentsCount: 12,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    initials: "MW",
    avatarColor: "#ff6b35",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    tags: ["perfect300", "clean", "stormnation"],
  },
  {
    id: "mom-2",
    userId: 3,
    username: "SPARE_QUEEN",
    name: "Jasmine Park",
    rank: "Legend" as const,
    rankColor: RANK_COLORS["Legend"],
    content: "Quick tip on heavy oil: Move 3 boards left and look for the dry edge near board 7. Got 7 strikes in a row once I made the transition! #oilpattern #strategy #bowlingtips",
    score: 248,
    type: "advice" as const,
    likes: 52,
    dislikes: 0,
    commentsCount: 8,
    isLiked: true,
    isDisliked: false,
    isSaved: true,
    initials: "JP",
    avatarColor: "#9fe870",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    tags: ["oilpattern", "strategy", "bowlingtips"],
  },
  {
    id: "mom-3",
    userId: 1,
    username: "STRIKER_AC",
    name: "Alex Chen",
    rank: "Legend" as const,
    rankColor: RANK_COLORS["Legend"],
    content: "Drilled the new Hammer Black Widow 3.0 today! The backend snap on fresh house oil is unreal. Logged a 267 and 291 in testing. #arsenal #hammerbowling #highgame",
    score: 291,
    type: "gear" as const,
    likes: 67,
    dislikes: 2,
    commentsCount: 14,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    initials: "AC",
    avatarColor: "#9fe870",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    tags: ["arsenal", "hammerbowling", "highgame"],
  },
  {
    id: "mom-4",
    userId: 4,
    username: "HOOK_MASTER",
    name: "Leo Hook",
    rank: "Legend" as const,
    rankColor: RANK_COLORS["Legend"],
    content: "Accepted a $100 challenge against GUTTER_KING and took the win with a 278! Great match bro, rematch whenever you're ready. #challenge #win #clutch",
    score: 278,
    type: "challenge" as const,
    likes: 43,
    dislikes: 1,
    commentsCount: 9,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    initials: "LH",
    avatarColor: "#9fe870",
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    tags: ["challenge", "win", "clutch"],
  },
];

let comments: Record<string, any[]> = {
  "mom-1": [
    { id: "c-1", momentId: "mom-1", userId: 1, username: "STRIKER_AC", initials: "AC", avatarColor: "#9fe870", rank: "Legend", content: "Monster set! That 10th frame carry on the 4-pin was clutch.", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { id: "c-2", momentId: "mom-1", userId: 3, username: "SPARE_QUEEN", initials: "JP", avatarColor: "#9fe870", rank: "Legend", content: "Unbelievable shooting Marcus! Congrats on the ring!", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  ],
  "mom-2": [
    { id: "c-3", momentId: "mom-2", userId: 6, username: "GUTTER_KING", initials: "TB", avatarColor: "#60c8ff", rank: "Diamond I", content: "Needed this! I was burning up the heads all night last week.", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  ],
};

let games = [
  { id: "g-1", userId: 1, score: 291, date: "2026-05-02", alley: "Bowlero Midtown Lanes", oilPattern: "House Shot", ballUsed: "Hammer Black Widow 3.0", notes: "11 strikes, left a 10-pin in the 8th frame. Fantastic look all game.", verified: true, entryMethod: "quick" },
  { id: "g-2", userId: 1, score: 267, date: "2026-05-01", alley: "Bowlero Midtown Lanes", oilPattern: "House Shot", ballUsed: "Storm Phaze II", notes: "Solid pocket hits, 8 bagger to finish the game.", verified: true, entryMethod: "quick" },
  { id: "g-3", userId: 1, score: 248, date: "2026-04-28", alley: "AMF Pro Bowl", oilPattern: "Viper 36ft (Sport)", ballUsed: "Motiv Jackal Ghost", notes: "Sport shot league game 1. Tight line up board 8.", verified: true, entryMethod: "quick" },
  { id: "g-4", userId: 1, score: 279, date: "2026-04-24", alley: "Sunset National Lanes", oilPattern: "House Shot", ballUsed: "Storm Phaze II", notes: "Clean game! Clean 30 clean frames for the series.", verified: true, entryMethod: "quick" },
  { id: "g-5", userId: 1, score: 234, date: "2026-04-20", alley: "Bowlero Midtown Lanes", oilPattern: "Chameleon 39ft", ballUsed: "Roto Grip Gem", notes: "Heavy midlane friction early.", verified: true, entryMethod: "quick" },
];

let userBalls = [
  { id: "b-1", userId: 1, name: "Phaze II", brand: "Storm", weight: 15, coverstock: "TX-16 Solid", core: "Velocity", surface: "3000 Abralon", color: "Red / Blue / Purple", drillingLayout: "55 x 4.5 x 35", notes: "My benchmark ball for fresh house patterns.", isActive: true },
  { id: "b-2", userId: 1, name: "Black Widow 3.0", brand: "Hammer", weight: 15, coverstock: "Gas Mask Solid", core: "Gas Mask Asymmetric", surface: "500/1000/1500", color: "Black / Red", drillingLayout: "60 x 5 x 40", notes: "Strong hook for heavy oil transitions.", isActive: true },
  { id: "b-3", userId: 1, name: "Jackal Ghost", brand: "Motiv", weight: 15, coverstock: "Coercion MXHC Hybrid", core: "Jackal Asymmetric", surface: "2000 LSS", color: "Purple / Black", drillingLayout: "50 x 4 x 30", notes: "Sport shot weapon with great continuation.", isActive: true },
  { id: "b-4", userId: 1, name: "White Dot Spare", brand: "Columbia 300", weight: 15, coverstock: "Polyester / Plastic", core: "Bullet", surface: "High Gloss", color: "Patriot Sparkle", drillingLayout: "Standard Pin", notes: "Straight shooting at corner 10-pins and 7-pins.", isActive: true },
];

let leagues = [
  { id: "lg-1", name: "Midnight Strikers 3v3", description: "Competitive high-stakes evening league for elite bowlers with weekly scratch brackets.", members: 124, type: "public" as const, level: "ADVANCED" as const, avgScore: 231, weeklyChallenge: "Highest single scratch game wins $250 pot", dayOfWeek: "Thursday", time: "8:30 PM", location: "Bowlero Midtown Lanes", prizeFund: "$12,500", isJoined: true },
  { id: "lg-2", name: "Sunday Masters Classic", description: "Weekend scratch tournament format with rotating sport oil patterns every 4 weeks.", members: 88, type: "public" as const, level: "EXPERT" as const, avgScore: 242, weeklyChallenge: "Top 8 stepladder finals bracket", dayOfWeek: "Sunday", time: "11:00 AM", location: "Sunset National Lanes", prizeFund: "$18,000", isJoined: false },
  { id: "lg-3", name: "Pro Circuit Invitational", description: "Invite-only league for certified 210+ average bowlers. Live telemetry & stats tracking.", members: 32, type: "private" as const, level: "EXPERT" as const, avgScore: 258, weeklyChallenge: "300 game bounty awards $1,000 bonus", dayOfWeek: "Tuesday", time: "7:00 PM", location: "AMF Pro Bowl", prizeFund: "$35,000", isJoined: false },
  { id: "lg-4", name: "Friday Mixed Trios & Fun", description: "High-energy handicap and scratch league welcoming all skill levels with weekly mystery scores.", members: 156, type: "public" as const, level: "INTERMEDIATE" as const, avgScore: 185, weeklyChallenge: "Most improved average over handicap", dayOfWeek: "Friday", time: "6:30 PM", location: "Thunderbird Bowl", prizeFund: "$8,000", isJoined: true },
];

let friends = [
  { id: 2, username: "KING_PINS", name: "Marcus Williams", rank: "Kingpin" as const, careerAvg: 241, highGame: 300, level: 87, team: "Strike Force", rating: 2341, avatarColor: "#ff6b35", initials: "MW", status: "friend" as const },
  { id: 3, username: "SPARE_QUEEN", name: "Jasmine Park", rank: "Legend" as const, careerAvg: 228, highGame: 299, level: 63, team: "Solo", rating: 1998, avatarColor: "#9fe870", initials: "JP", status: "friend" as const },
  { id: 5, username: "STRIKE_NOVA", name: "Priya Sharma", rank: "Platinum I" as const, careerAvg: 215, highGame: 295, level: 52, team: "Nova Crew", rating: 1876, avatarColor: "#c8a8e8", initials: "PS", status: "friend" as const },
  { id: 6, username: "GUTTER_KING", name: "Tyler Brooks", rank: "Diamond I" as const, careerAvg: 198, highGame: 289, level: 41, team: "Solo", rating: 1654, avatarColor: "#60c8ff", initials: "TB", status: "incoming_request" as const },
  { id: 8, username: "BOWL_MASTER", name: "Derek Johnson", rank: "Expert" as const, careerAvg: 182, highGame: 278, level: 29, team: "Solo", rating: 1423, avatarColor: "#f5c842", initials: "DJ", status: "outgoing_request" as const },
];

let savedMoments: string[] = ["mom-2"];

const bowlingCenters = [
  { id: "c-1", name: "Bowlero Midtown Lanes", address: "740 8th Ave, Midtown", lanes: 40, syntheticLanes: true, proShop: true, patterns: ["House Shot", "Shark 43ft", "Chameleon 39ft"] },
  { id: "c-2", name: "Sunset National Lanes", address: "1280 Sunset Blvd", lanes: 48, syntheticLanes: true, proShop: true, patterns: ["House Shot", "Viper 36ft", "Cheetah 35ft"] },
  { id: "c-3", name: "AMF Pro Bowl & Lounge", address: "450 Center St", lanes: 32, syntheticLanes: true, proShop: true, patterns: ["House Shot", "Scorpion 42ft", "Flat USBC Sport"] },
  { id: "c-4", name: "Thunderbird Bowl", address: "890 Pine Valley Way", lanes: 24, syntheticLanes: false, proShop: false, patterns: ["House Shot"] },
];

// ── API ROUTES ───────────────────────────────────────────────────────────────

// 1. Health
app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "League Bowling API" });
});

// 2. User Profiles
app.get(["/api/user", "/api/users/me"], (req, res) => {
  res.json(currentUser);
});

app.put(["/api/user", "/api/users/me"], (req, res) => {
  currentUser = { ...currentUser, ...req.body };
  res.json(currentUser);
});

app.patch(["/api/user", "/api/users/me"], (req, res) => {
  currentUser = { ...currentUser, ...req.body };
  res.json(currentUser);
});

app.post("/api/user/upgrade-pro", (req, res) => {
  currentUser.isPro = true;
  currentUser.xp += 500;
  res.json({ success: true, isPro: true, user: currentUser });
});

app.get("/api/users/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const results = allUsers.filter(
    (u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
  );
  res.json(results);
});

app.get("/api/users/:id", (req, res) => {
  const user = allUsers.find((u) => u.id === Number(req.params.id)) || currentUser;
  res.json(user);
});

// 3. Challenges
app.get("/api/challenges", (req, res) => {
  res.json(challenges.filter((c) => c.status === "open" && c.userId !== currentUser.id));
});

app.get("/api/challenges/my", (req, res) => {
  res.json(challenges.filter((c) => c.userId === currentUser.id));
});

app.post("/api/challenges", (req, res) => {
  const { postedScore, score, stake, notes } = req.body;
  const finalScore = Number(postedScore || score) || 200;
  const newCh = {
    id: `ch-${Date.now()}`,
    userId: currentUser.id,
    username: currentUser.username,
    name: currentUser.name,
    rank: currentUser.rank,
    rankColor: RANK_COLORS[currentUser.rank] || "#9fe870",
    postedScore: finalScore,
    stake: Number(stake) || 10,
    status: "open" as const,
    initials: "AC",
    avatarColor: "#9fe870",
    isPro: currentUser.isPro,
    createdAt: new Date().toISOString(),
    notes: notes || "Open match challenge! Beat my score to win.",
  };
  challenges.unshift(newCh);
  res.status(201).json(newCh);
});

app.post("/api/challenges/:id/accept", (req, res) => {
  const ch = challenges.find((c) => c.id === req.params.id);
  if (!ch) return res.status(404).json({ error: "Challenge not found" });
  ch.status = "active";
  ch.acceptedByUserId = currentUser.id;
  ch.acceptedByUsername = currentUser.username;
  res.json(ch);
});

app.post("/api/challenges/:id/complete", (req, res) => {
  const ch = challenges.find((c) => c.id === req.params.id);
  if (!ch) return res.status(404).json({ error: "Challenge not found" });
  const userScore = Number(req.body.score) || 0;
  const won = userScore > ch.postedScore;
  const bsrChange = won ? Math.round(15 + ch.stake * 0.4) : -Math.round(10 + ch.stake * 0.2);

  ch.status = "completed";
  ch.acceptedScore = userScore;
  ch.winnerUserId = won ? currentUser.id : ch.userId;

  // Update user stats
  if (won) {
    currentUser.wins += 1;
    currentUser.rating += bsrChange;
    currentUser.xp += 350;
  } else {
    currentUser.losses += 1;
    currentUser.rating = Math.max(800, currentUser.rating + bsrChange);
    currentUser.xp += 100;
  }

  res.json({ result: won ? "won" : "lost", bsrChange, challenge: ch });
});

app.delete("/api/challenges/:id", (req, res) => {
  challenges = challenges.filter((c) => c.id !== req.params.id);
  res.json({ success: true });
});

// 4. Games / Scores
app.get("/api/games", (req, res) => {
  res.json(games);
});

app.post("/api/games", (req, res) => {
  const { score, alley, oilPattern, ballUsed, notes, frames, entryMethod } = req.body;
  const gameScore = Math.max(0, Math.min(300, Number(score) || 0));

  const newGame = {
    id: `g-${Date.now()}`,
    userId: currentUser.id,
    score: gameScore,
    date: new Date().toISOString().split("T")[0],
    alley: alley || "Bowlero Midtown Lanes",
    oilPattern: oilPattern || "House Shot",
    ballUsed: ballUsed || "Storm Phaze II",
    notes: notes || "",
    verified: true,
    frames: frames || null,
    entryMethod: entryMethod || "quick",
  };

  games.unshift(newGame);

  // Recalculate stats
  const totalScore = games.reduce((acc, g) => acc + g.score, 0);
  currentUser.totalGames = games.length;
  currentUser.careerAvg = Math.round(totalScore / games.length);
  currentUser.highGame = Math.max(currentUser.highGame, gameScore);
  currentUser.xp += Math.round(gameScore * 1.5);

  // Level up calculation
  if (currentUser.xp >= currentUser.xpToNext) {
    currentUser.level += 1;
    currentUser.xpToNext = Math.round(currentUser.xpToNext * 1.25);
  }

  res.status(201).json(newGame);
});

app.delete("/api/games/:id", (req, res) => {
  games = games.filter((g) => g.id !== req.params.id);
  res.json({ success: true });
});

// 5. Moments (Social Feed)
app.get("/api/moments", (req, res) => {
  const tag = req.query.tag ? String(req.query.tag).toLowerCase() : null;
  let list = moments.map((m) => ({
    ...m,
    isSaved: savedMoments.includes(m.id),
  }));
  if (tag) {
    list = list.filter((m) => m.tags.some((t) => t.toLowerCase() === tag));
  }
  res.json(list);
});

app.get("/api/moments/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const list = moments.filter(
    (m) =>
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q)) ||
      m.username.toLowerCase().includes(q)
  );
  res.json(list);
});

app.post("/api/moments", (req, res) => {
  const { content, score, type } = req.body;
  // Extract hashtags
  const foundTags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) =>
    t.replace("#", "").toLowerCase()
  );

  const newMoment = {
    id: `mom-${Date.now()}`,
    userId: currentUser.id,
    username: currentUser.username,
    name: currentUser.name,
    rank: currentUser.rank,
    rankColor: RANK_COLORS[currentUser.rank] || "#9fe870",
    content: content || "Bowling session completed!",
    score: score ? Number(score) : null,
    type: type || "game",
    likes: 0,
    dislikes: 0,
    commentsCount: 0,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    initials: "AC",
    avatarColor: "#9fe870",
    createdAt: new Date().toISOString(),
    tags: foundTags.length > 0 ? foundTags : ["bowling", "league"],
  };

  moments.unshift(newMoment);
  currentUser.xp += 75;
  res.status(201).json(newMoment);
});

app.post("/api/moments/:id/like", (req, res) => {
  const m = moments.find((x) => x.id === req.params.id);
  if (m) {
    m.isLiked = true;
    m.likes += 1;
    if (m.isDisliked) {
      m.isDisliked = false;
      m.dislikes = Math.max(0, m.dislikes - 1);
    }
  }
  res.json(m || {});
});

app.delete("/api/moments/:id/like", (req, res) => {
  const m = moments.find((x) => x.id === req.params.id);
  if (m && m.isLiked) {
    m.isLiked = false;
    m.likes = Math.max(0, m.likes - 1);
  }
  res.json(m || {});
});

app.post("/api/moments/:id/dislike", (req, res) => {
  const m = moments.find((x) => x.id === req.params.id);
  if (m) {
    m.isDisliked = true;
    m.dislikes += 1;
    if (m.isLiked) {
      m.isLiked = false;
      m.likes = Math.max(0, m.likes - 1);
    }
  }
  res.json(m || {});
});

app.delete("/api/moments/:id/dislike", (req, res) => {
  const m = moments.find((x) => x.id === req.params.id);
  if (m && m.isDisliked) {
    m.isDisliked = false;
    m.dislikes = Math.max(0, m.dislikes - 1);
  }
  res.json(m || {});
});

app.post("/api/moments/:id/save", (req, res) => {
  const id = req.params.id;
  if (!savedMoments.includes(id)) {
    savedMoments.push(id);
  }
  res.json({ saved: true });
});

app.delete("/api/moments/:id/save", (req, res) => {
  const id = req.params.id;
  savedMoments = savedMoments.filter((x) => x !== id);
  res.json({ saved: false });
});

app.get("/api/saves", (req, res) => {
  const list = moments.filter((m) => savedMoments.includes(m.id));
  res.json(list);
});

app.get("/api/moments/:id/comments", (req, res) => {
  const list = comments[req.params.id] || [];
  res.json(list);
});

app.post("/api/moments/:id/comments", (req, res) => {
  const { content } = req.body;
  const list = comments[req.params.id] || [];
  const newComment = {
    id: `c-${Date.now()}`,
    momentId: req.params.id,
    userId: currentUser.id,
    username: currentUser.username,
    initials: "AC",
    avatarColor: "#9fe870",
    rank: currentUser.rank,
    content: content || "",
    createdAt: new Date().toISOString(),
  };
  list.push(newComment);
  comments[req.params.id] = list;

  const m = moments.find((x) => x.id === req.params.id);
  if (m) m.commentsCount = list.length;

  res.status(201).json(newComment);
});

app.delete("/api/comments/:id", (req, res) => {
  for (const mid in comments) {
    comments[mid] = comments[mid].filter((c) => c.id !== req.params.id);
    const m = moments.find((x) => x.id === mid);
    if (m) m.commentsCount = comments[mid].length;
  }
  res.json({ success: true });
});

// 6. Leagues
app.get("/api/leagues", (req, res) => {
  res.json(leagues);
});

app.post("/api/leagues/:id/join", (req, res) => {
  const lg = leagues.find((l) => l.id === req.params.id);
  if (lg) {
    lg.isJoined = !lg.isJoined;
    lg.members += lg.isJoined ? 1 : -1;
  }
  res.json(lg || {});
});

// 7. Leaderboard
app.get("/api/leaderboard", (req, res) => {
  const filter = req.query.filter || "global";
  let list = [...allUsers];

  if (filter === "friends") {
    const friendIds = friends.filter((f) => f.status === "friend").map((f) => f.id);
    friendIds.push(currentUser.id);
    list = list.filter((u) => friendIds.includes(u.id));
  } else if (filter === "team") {
    list = list.filter((u) => u.team === currentUser.team);
  }

  // Sort by rating descending
  list.sort((a, b) => b.rating - a.rating);

  res.json(list);
});

// 8. Friends
app.get("/api/friends", (req, res) => {
  res.json(friends);
});

app.get("/api/friends/requests", (req, res) => {
  res.json(friends.filter((f) => f.status === "incoming_request"));
});

app.post(["/api/friends/request", "/api/friends/:userId/request"], (req, res) => {
  const targetId = Number(req.params.userId || req.body.userId);
  const target = allUsers.find((u) => u.id === targetId);
  if (target) {
    const existing = friends.find((f) => f.id === targetId);
    if (!existing) {
      friends.push({
        id: target.id,
        username: target.username,
        name: target.name,
        rank: target.rank,
        careerAvg: target.careerAvg,
        highGame: target.highGame,
        level: target.level,
        team: target.team,
        rating: target.rating,
        avatarColor: "#c8a8e8",
        initials: target.username.slice(0, 2).toUpperCase(),
        status: "outgoing_request",
      });
    }
  }
  res.json({ success: true });
});

app.post("/api/friends/:userId/accept", (req, res) => {
  const targetId = Number(req.params.userId);
  const f = friends.find((x) => x.id === targetId);
  if (f) {
    f.status = "friend";
  }
  res.json({ success: true });
});

app.delete("/api/friends/:userId", (req, res) => {
  const targetId = Number(req.params.userId);
  friends = friends.filter((x) => x.id !== targetId);
  res.json({ success: true });
});

// 9. Bowling Balls Arsenal & Catalog
app.get("/api/balls", (req, res) => {
  res.json(userBalls);
});

app.post("/api/balls", (req, res) => {
  const { name, brand, weight, color, coverstock, core, surface, drillingLayout, notes } = req.body;
  const newBall = {
    id: `b-${Date.now()}`,
    userId: currentUser.id,
    name: name || "Custom Ball",
    brand: brand || "Storm",
    weight: Number(weight) || 15,
    color: color || "Black/Red",
    coverstock: coverstock || "Solid Reactive",
    core: core || "Symmetric",
    surface: surface || "2000 Abralon",
    drillingLayout: drillingLayout || "50 x 4 x 35",
    notes: notes || "",
    isActive: true,
  };
  userBalls.push(newBall);
  res.status(201).json(newBall);
});

app.delete("/api/balls/:id", (req, res) => {
  userBalls = userBalls.filter((b) => b.id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/ball-catalog", (req, res) => {
  res.json([
    { brand: "Storm", model: "Phaze II", coverstock: "TX-16 Solid", core: "Velocity" },
    { brand: "Storm", model: "Hy-Road", coverstock: "R2S Solid", core: "Inverted Fe²" },
    { brand: "Storm", model: "Summit Peak", coverstock: "TX-23 Pearl", core: "Centripetal HD" },
    { brand: "Hammer", model: "Black Widow 3.0", coverstock: "Gas Mask Solid", core: "Gas Mask" },
    { brand: "Hammer", model: "Black Widow 2.0 Ghost", coverstock: "Aggression Pearl", core: "Gas Mask" },
    { brand: "Motiv", model: "Jackal Ghost", coverstock: "Coercion MXHC", core: "Predator V2" },
    { brand: "Motiv", model: "Venom Shock", coverstock: "Turmoil Solid", core: "Gear" },
    { brand: "Roto Grip", model: "Gem", coverstock: "MicroTrax Solid", core: "Defiant LRG" },
    { brand: "Roto Grip", model: "Hustle RIP", coverstock: "VTC Solid", core: "Hustle" },
    { brand: "Brunswick", model: "Quantum EVO", coverstock: "EVO Hybrid", core: "Quantum Mushroom" },
    { brand: "900 Global", model: "Zen", coverstock: "S77R Pearl", core: "Meditate" },
    { brand: "Columbia 300", model: "White Dot", coverstock: "Polyester Plastic", core: "Bullet" },
  ]);
});

// 10. Alleys / Bowling Centers
app.get("/api/alleys", (req, res) => {
  res.json(bowlingCenters);
});

// 11. AI Scorecard Verification Simulation
app.post("/api/scorecard/verify", (req, res) => {
  const { simulatedScore, alleyName } = req.body;
  const score = Number(simulatedScore) || Math.floor(Math.random() * 80 + 190);
  res.json({
    verified: true,
    score,
    confidence: 0.98,
    strikes: Math.floor(score / 28),
    spares: Math.floor((300 - score) / 25),
    detectedAlley: alleyName || "Bowlero Midtown Lanes",
    detectedPattern: "House Shot 41ft",
    analysis: `Detected clean 10-frame bowling scorecard. Verified final total of ${score} with consistent pinfall metrics.`,
  });
});

// 12. Stat Reports
app.get("/api/stat-reports", (req, res) => {
  const avg = currentUser.careerAvg;
  const high = currentUser.highGame;
  const total = currentUser.totalGames;
  res.json({
    period: "Season 2026",
    summary: {
      average: avg,
      highGame: high,
      totalGames: total,
      cleanGamePercentage: 74.2,
      strikePercentage: 58.4,
      singlePinSpareConversion: 92.1,
      multiPinSpareConversion: 68.5,
      firstBallAverage: 9.24,
    },
    patternPerformance: [
      { pattern: "House Shot", games: 18, avg: 224, high: 291 },
      { pattern: "Viper 36ft (Sport)", games: 6, avg: 202, high: 248 },
      { pattern: "Chameleon 39ft", games: 4, avg: 211, high: 234 },
    ],
  });
});

// 404 JSON Handler for unmatched /api routes
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// ── VITE MIDDLEWARE / STATIC ASSETS ───────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎳 League Bowling Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
