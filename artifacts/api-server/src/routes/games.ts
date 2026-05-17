import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import {
  ListGamesResponse,
  ListGamesResponseItem,
  CreateGameBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/games", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListGamesResponse.parse((data ?? []).map(mapGame)));
});

router.post("/games", async (req, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.score < 0 || parsed.data.score > 300) {
    res.status(400).json({ error: "Score must be between 0 and 300" });
    return;
  }

  const rawBody = req.body as Record<string, unknown>;
  const ballIdRaw = rawBody?.ballId;
  let ballId: number | null =
    typeof ballIdRaw === "number"
      ? ballIdRaw
      : typeof ballIdRaw === "string" && ballIdRaw && !isNaN(parseInt(ballIdRaw, 10))
        ? parseInt(ballIdRaw, 10)
        : null;

  // Verify the ball belongs to this user before linking. Service role bypasses
  // RLS, so we must enforce ownership in the route.
  if (ballId !== null) {
    const { data: ownedBall } = await supabaseAdmin
      .from("bowling_balls")
      .select("id")
      .eq("id", ballId)
      .eq("user_id", req.userId)
      .maybeSingle();
    if (!ownedBall) {
      res.status(403).json({ error: "Ball not found or not owned by user" });
      return;
    }
  }

  const { data: game, error: insertErr } = await supabaseAdmin
    .from("games")
    .insert({
      user_id: req.userId,
      score: parsed.data.score,
      date: parsed.data.date,
      alley: parsed.data.alley ?? "",
      oil_pattern: parsed.data.oilPattern ?? "House Shot",
      ball_used: parsed.data.ballUsed ?? "",
      ball_id: ballId,
      notes: parsed.data.notes ?? "",
      verified: parsed.data.verified ?? false,
    })
    .select()
    .single();

  if (insertErr || !game) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  const { data: allGames } = await supabaseAdmin
    .from("games")
    .select("score")
    .eq("user_id", req.userId);

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (user && allGames) {
    const totalScores = allGames.reduce((sum: number, g: { score: number }) => sum + g.score, 0);
    const newAvg = Math.round(totalScores / allGames.length);
    const newHighGame = Math.max(user.high_game, game.score);
    const xpGained = Math.floor(game.score / 10);
    const newXp = user.xp + xpGained;
    const leveledUp = newXp >= user.xp_to_next;

    await supabaseAdmin
      .from("users")
      .update({
        career_avg: newAvg,
        high_game: newHighGame,
        total_games: user.total_games + 1,
        xp: leveledUp ? newXp - user.xp_to_next : newXp,
        level: leveledUp ? user.level + 1 : user.level,
      })
      .eq("id", req.userId);
  }

  res.status(201).json(ListGamesResponseItem.parse(mapGame(game)));
});

function mapGame(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    score: row.score,
    date: row.date,
    alley: row.alley,
    oilPattern: row.oil_pattern,
    ballUsed: row.ball_used,
    ballId: row.ball_id ?? null,
    notes: row.notes,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

export default router;
