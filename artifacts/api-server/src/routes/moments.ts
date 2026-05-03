import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, momentsTable, momentLikesTable, usersTable } from "@workspace/db";
import {
  ListMomentsResponse,
  ListMomentsResponseItem,
  CreateMomentBody,
  LikeMomentParams,
  LikeMomentResponse,
  UnlikeMomentParams,
  UnlikeMomentResponse,
} from "@workspace/api-zod";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

async function formatMoment(
  moment: typeof momentsTable.$inferSelect,
  userId: number
) {
  const [like] = await db
    .select()
    .from(momentLikesTable)
    .where(
      and(
        eq(momentLikesTable.momentId, moment.id),
        eq(momentLikesTable.userId, userId)
      )
    );

  return {
    ...moment,
    liked: !!like,
    timeAgo: timeAgo(moment.createdAt),
  };
}

router.get("/moments", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(momentsTable)
    .orderBy(desc(momentsTable.createdAt));

  const formatted = await Promise.all(
    rows.map((m) => formatMoment(m, req.userId))
  );

  res.json(ListMomentsResponse.parse(formatted));
});

router.post("/moments", async (req, res): Promise<void> => {
  const parsed = CreateMomentBody.safeParse(req.body);
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

  const [moment] = await db
    .insert(momentsTable)
    .values({
      userId: req.userId,
      username: user.username,
      rank: user.rank,
      rankColor: rankColor(user.rank),
      content: parsed.data.content,
      score: parsed.data.score ?? null,
      type: parsed.data.type,
      likes: 0,
      comments: 0,
      initials: user.username.substring(0, 2),
      avatarColor: "#1a3c2a",
    })
    .returning();

  res.status(201).json(
    ListMomentsResponseItem.parse(await formatMoment(moment, req.userId))
  );
});

router.post("/moments/:id/like", async (req, res): Promise<void> => {
  const params = LikeMomentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [moment] = await db
    .select()
    .from(momentsTable)
    .where(eq(momentsTable.id, params.data.id));

  if (!moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const [existingLike] = await db
    .select()
    .from(momentLikesTable)
    .where(
      and(
        eq(momentLikesTable.momentId, params.data.id),
        eq(momentLikesTable.userId, req.userId)
      )
    );

  if (!existingLike) {
    await db.insert(momentLikesTable).values({
      momentId: params.data.id,
      userId: req.userId,
    });

    const [updated] = await db
      .update(momentsTable)
      .set({ likes: moment.likes + 1 })
      .where(eq(momentsTable.id, params.data.id))
      .returning();

    res.json(LikeMomentResponse.parse(await formatMoment(updated, req.userId)));
    return;
  }

  res.json(LikeMomentResponse.parse(await formatMoment(moment, req.userId)));
});

router.delete("/moments/:id/like", async (req, res): Promise<void> => {
  const params = UnlikeMomentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [moment] = await db
    .select()
    .from(momentsTable)
    .where(eq(momentsTable.id, params.data.id));

  if (!moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const deleted = await db
    .delete(momentLikesTable)
    .where(
      and(
        eq(momentLikesTable.momentId, params.data.id),
        eq(momentLikesTable.userId, req.userId)
      )
    )
    .returning();

  if (deleted.length > 0) {
    const newLikes = Math.max(0, moment.likes - 1);
    const [updated] = await db
      .update(momentsTable)
      .set({ likes: newLikes })
      .where(eq(momentsTable.id, params.data.id))
      .returning();

    res.json(
      UnlikeMomentResponse.parse(await formatMoment(updated, req.userId))
    );
    return;
  }

  res.json(UnlikeMomentResponse.parse(await formatMoment(moment, req.userId)));
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
