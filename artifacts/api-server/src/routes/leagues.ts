import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, leaguesTable, leagueMembershipsTable } from "@workspace/db";
import {
  ListLeaguesResponse,
  JoinLeagueParams,
  JoinLeagueResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatLeague(
  league: typeof leaguesTable.$inferSelect,
  userId: number
) {
  const [membership] = await db
    .select()
    .from(leagueMembershipsTable)
    .where(
      and(
        eq(leagueMembershipsTable.leagueId, league.id),
        eq(leagueMembershipsTable.userId, userId)
      )
    );

  return { ...league, joined: !!membership };
}

router.get("/leagues", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(leaguesTable)
    .orderBy(desc(leaguesTable.createdAt));

  const formatted = await Promise.all(
    rows.map((l) => formatLeague(l, req.userId))
  );

  res.json(ListLeaguesResponse.parse(formatted));
});

router.post("/leagues/:id/join", async (req, res): Promise<void> => {
  const params = JoinLeagueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [league] = await db
    .select()
    .from(leaguesTable)
    .where(eq(leaguesTable.id, params.data.id));

  if (!league) {
    res.status(404).json({ error: "League not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(leagueMembershipsTable)
    .where(
      and(
        eq(leagueMembershipsTable.leagueId, params.data.id),
        eq(leagueMembershipsTable.userId, req.userId)
      )
    );

  if (!existing) {
    await db.insert(leagueMembershipsTable).values({
      leagueId: params.data.id,
      userId: req.userId,
      status: "member",
    });

    const [updated] = await db
      .update(leaguesTable)
      .set({ members: league.members + 1 })
      .where(eq(leaguesTable.id, params.data.id))
      .returning();

    res.json(JoinLeagueResponse.parse(await formatLeague(updated, req.userId)));
    return;
  }

  res.json(JoinLeagueResponse.parse(await formatLeague(league, req.userId)));
});

export default router;
