import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, gamesTable, usersTable } from "@workspace/db";
import {
  ListGamesResponse,
  ListGamesResponseItem,
  CreateGameBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/games", async (req, res): Promise<void> => {
  const games = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.userId, req.userId))
    .orderBy(desc(gamesTable.createdAt));

  res.json(ListGamesResponse.parse(games));
});

router.post("/games", async (req, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [game] = await db
    .insert(gamesTable)
    .values({
      userId: req.userId,
      score: parsed.data.score,
      date: parsed.data.date,
      alley: parsed.data.alley,
      oilPattern: parsed.data.oilPattern,
      ballUsed: parsed.data.ballUsed,
      notes: parsed.data.notes ?? "",
      verified: parsed.data.verified ?? false,
    })
    .returning();

  const allGames = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.userId, req.userId));

  const totalScores = allGames.reduce((sum, g) => sum + g.score, 0);
  const newAvg = Math.round(totalScores / allGames.length);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId));

  if (user) {
    const newHighGame = Math.max(user.highGame, game.score);
    const xpGained = Math.floor(game.score / 10);
    const newXp = user.xp + xpGained;
    const leveledUp = newXp >= user.xpToNext;

    await db
      .update(usersTable)
      .set({
        careerAvg: newAvg,
        highGame: newHighGame,
        totalGames: user.totalGames + 1,
        xp: leveledUp ? newXp - user.xpToNext : newXp,
        level: leveledUp ? user.level + 1 : user.level,
      })
      .where(eq(usersTable.id, req.userId));
  }

  res.status(201).json(ListGamesResponseItem.parse(game));
});

export default router;
