import { db } from "@workspace/db";
import {
  usersTable,
  challengesTable,
  momentsTable,
  leaguesTable,
  gamesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

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

async function seed() {
  console.log("Seeding League database...");

  // Upsert demo user (id=1)
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, 1));

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      id: 1,
      username: "STRIKER_AC",
      name: "Alex Chen",
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
    });
    console.log("Created demo user (id=1)");
  } else {
    console.log("Demo user already exists, skipping");
  }

  // Seed NPC users for challenges and moments
  const npcUsers = [
    { id: 2, username: "STRIKER_44", name: "Sam Wilson", rank: "Diamond IV", level: 31, xp: 8000, xpToNext: 10000, isPro: false, careerAvg: 245, highGame: 289, totalGames: 412, team: "Solo", rating: 1650 },
    { id: 3, username: "KINGPIN_J", name: "Jake Monroe", rank: "Platinum II", level: 38, xp: 10200, xpToNext: 12000, isPro: true, careerAvg: 258, highGame: 298, totalGames: 623, team: "Elite Squad", rating: 1780 },
    { id: 4, username: "LANE_KING", name: "Chris Lane", rank: "Legend", level: 45, xp: 14000, xpToNext: 15000, isPro: true, careerAvg: 271, highGame: 300, totalGames: 1043, team: "Pinfall Kings", rating: 1910 },
    { id: 5, username: "PINSEEKER", name: "Mia Torres", rank: "Diamond III", level: 29, xp: 7400, xpToNext: 9000, isPro: false, careerAvg: 239, highGame: 278, totalGames: 334, team: "Solo", rating: 1590 },
    { id: 6, username: "ROLLMASTER", name: "Derek Roll", rank: "Expert", level: 22, xp: 5600, xpToNext: 7000, isPro: false, careerAvg: 211, highGame: 265, totalGames: 218, team: "Solo", rating: 1420 },
    { id: 7, username: "PINMASTER", name: "Ava Pierce", rank: "Diamond I", level: 36, xp: 9800, xpToNext: 11000, isPro: false, careerAvg: 262, highGame: 291, totalGames: 508, team: "Friday Night Crew", rating: 1820 },
    { id: 8, username: "SPARE_QUEEN", name: "Nina Ross", rank: "Platinum I", level: 40, xp: 11500, xpToNext: 13000, isPro: true, careerAvg: 254, highGame: 295, totalGames: 712, team: "Strike Force", rating: 1855 },
    { id: 9, username: "HOOK_MASTER", name: "Leo Hook", rank: "Legend", level: 48, xp: 13800, xpToNext: 15000, isPro: true, careerAvg: 278, highGame: 300, totalGames: 1287, team: "Midnight Strikers", rating: 1965 },
    { id: 10, username: "LANE_GHOST", name: "Zara Ghost", rank: "Diamond II", level: 33, xp: 9100, xpToNext: 11000, isPro: false, careerAvg: 249, highGame: 289, totalGames: 445, team: "Solo", rating: 1710 },
  ];

  for (const npc of npcUsers) {
    const [exists] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, npc.id));
    if (!exists) {
      await db.insert(usersTable).values(npc);
    }
  }
  console.log("NPC users seeded");

  // Seed demo games for user 1
  const existingGames = await db
    .select({ id: gamesTable.id })
    .from(gamesTable)
    .where(eq(gamesTable.userId, 1));

  if (existingGames.length === 0) {
    await db.insert(gamesTable).values([
      { userId: 1, score: 267, date: "2026-05-02", alley: "Bowlero Midtown", oilPattern: "House Shot", ballUsed: "Storm Phaze II", notes: "Great carry on the 7-pin all night", verified: true },
      { userId: 1, score: 248, date: "2026-05-01", alley: "AMF Pro Bowl", oilPattern: "Sport Shot", ballUsed: "Motiv Trident", notes: "", verified: true },
      { userId: 1, score: 291, date: "2026-04-29", alley: "Bowlero Midtown", oilPattern: "House Shot", ballUsed: "Storm Phaze II", notes: "Personal best session", verified: true },
    ]);
    console.log("Demo games seeded");
  }

  // Seed open challenges from NPC users
  const existingChallenges = await db.select({ id: challengesTable.id }).from(challengesTable);
  if (existingChallenges.length === 0) {
    await db.insert(challengesTable).values([
      { userId: 2, username: "STRIKER_44", rank: "Diamond IV", rankColor: RANK_COLORS["Diamond IV"], postedScore: 278, stake: 50, status: "open", initials: "S4", avatarColor: "#2a3a5c", isPro: false },
      { userId: 3, username: "KINGPIN_J", rank: "Platinum II", rankColor: RANK_COLORS["Platinum II"], postedScore: 245, stake: 150, status: "open", initials: "KJ", avatarColor: "#3c2a5c", isPro: true },
      { userId: 4, username: "LANE_KING", rank: "Legend", rankColor: RANK_COLORS["Legend"], postedScore: 295, stake: 25, status: "open", initials: "LK", avatarColor: "#1a3c2a", isPro: true },
      { userId: 5, username: "PINSEEKER", rank: "Diamond III", rankColor: RANK_COLORS["Diamond III"], postedScore: 261, stake: 75, status: "open", initials: "PS", avatarColor: "#3c1a2a", isPro: false },
      { userId: 6, username: "ROLLMASTER", rank: "Expert", rankColor: RANK_COLORS["Expert"], postedScore: 232, stake: 10, status: "open", initials: "RM", avatarColor: "#3c3a1a", isPro: false },
    ]);
    console.log("Challenges seeded");
  }

  // Seed social moments
  const existingMoments = await db.select({ id: momentsTable.id }).from(momentsTable);
  if (existingMoments.length === 0) {
    await db.insert(momentsTable).values([
      { userId: 7, username: "PINMASTER", rank: "Diamond I", rankColor: RANK_COLORS["Diamond I"], content: "Back-to-back 290s this week on the house shot. The oil pattern has been perfect lately.", score: 290, type: "game", likes: 47, comments: 12, initials: "PM", avatarColor: "#1a2a5c" },
      { userId: 8, username: "SPARE_QUEEN", rank: "Platinum I", rankColor: RANK_COLORS["Platinum I"], content: "Any tips for a 7-10 split? I've been leaving it every third game and it's killing my average.", score: null, type: "advice", likes: 23, comments: 34, initials: "SQ", avatarColor: "#3c1a4a" },
      { userId: 9, username: "HOOK_MASTER", rank: "Legend", rankColor: RANK_COLORS["Legend"], content: "Finally cracked 300 in the Thursday night league. The Storm Phaze III was absolutely dialed in.", score: 300, type: "strike", likes: 234, comments: 67, initials: "HM", avatarColor: "#1a3c1a" },
      { userId: 6, username: "ROLLMASTER", rank: "Expert", rankColor: RANK_COLORS["Expert"], content: "Oil pattern on lanes 14-16 at Bowlero tonight was brutal. Anyone else struggle with the sport shot?", score: null, type: "advice", likes: 18, comments: 29, initials: "RM", avatarColor: "#3c2a1a" },
      { userId: 10, username: "LANE_GHOST", rank: "Diamond II", rankColor: RANK_COLORS["Diamond II"], content: "Accepted a $50 challenge and bowled a 288. Easiest money I've made this month.", score: 288, type: "challenge", likes: 89, comments: 21, initials: "LG", avatarColor: "#1a3c4a" },
    ]);
    console.log("Moments seeded");
  }

  // Seed leagues
  const existingLeagues = await db.select({ id: leaguesTable.id }).from(leaguesTable);
  if (existingLeagues.length === 0) {
    await db.insert(leaguesTable).values([
      { name: "Midnight Strikers", description: "Underground 3v3 circuit for elite nighttime bowlers", members: 124, type: "public", level: "ADVANCED", avgScore: 231, weeklyChallenge: "Highest single game wins $200" },
      { name: "Sunday Classics", description: "Weekend warriors competing for pride and prizes", members: 89, type: "public", level: "INTERMEDIATE", avgScore: 188, weeklyChallenge: "Best spare percentage this week" },
      { name: "Pro Circuit", description: "Invite-only league for ranked Diamond+ players", members: 32, type: "private", level: "EXPERT", avgScore: 267, weeklyChallenge: "First to 300 wins the pot" },
      { name: "Friday Night Lights", description: "Casual league with big energy and bigger scores", members: 156, type: "public", level: "BEGINNER", avgScore: 162, weeklyChallenge: "Most improved score from last week" },
    ]);
    console.log("Leagues seeded");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
