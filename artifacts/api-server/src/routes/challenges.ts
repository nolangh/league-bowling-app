import { Router, type IRouter } from "express";
import { eq, ne, desc } from "drizzle-orm";
import { db, challengesTable, usersTable } from "@workspace/db";
import {
  ListChallengesResponse,
  ListChallengesResponseItem,
  ListMyChallengesResponse,
  AcceptChallengeParams,
  AcceptChallengeResponse,
  CreateChallengeBody,
} from "@workspace/api-zod";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

function withTimeAgo<T extends { createdAt: Date }>(row: T) {
  return { ...row, timeAgo: timeAgo(row.createdAt) };
}

router.get("/challenges", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(challengesTable)
    .where(ne(challengesTable.userId, req.userId))
    .orderBy(desc(challengesTable.createdAt));

  const open = rows.filter((r) => r.status === "open");
  res.json(ListChallengesResponse.parse(open.map(withTimeAgo)));
});

router.get("/challenges/my", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.userId, req.userId))
    .orderBy(desc(challengesTable.createdAt));

  res.json(ListMyChallengesResponse.parse(rows.map(withTimeAgo)));
});

router.post("/challenges", async (req, res): Promise<void> => {
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      userId: req.userId,
      username: user.username,
      rank: user.rank,
      rankColor: rankColor(user.rank),
      postedScore: parsed.data.postedScore,
      stake: parsed.data.stake,
      status: "open",
      initials: user.username.substring(0, 2),
      avatarColor: "#1a3c2a",
      isPro: user.isPro,
    })
    .returning();

  res.status(201).json(ListChallengesResponseItem.parse(withTimeAgo(challenge)));
});

router.post("/challenges/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptChallengeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, params.data.id));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const [updated] = await db
    .update(challengesTable)
    .set({ status: "active" })
    .where(eq(challengesTable.id, params.data.id))
    .returning();

  res.json(AcceptChallengeResponse.parse(withTimeAgo(updated)));
});

function rankColor(rank: string): string {
  const colors: Record<string, string> = {
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
  return colors[rank] ?? "#a0a0a0";
}

export default router;
