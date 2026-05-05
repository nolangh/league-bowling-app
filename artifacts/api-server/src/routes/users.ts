import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { GetMeResponse, UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(mapUser(data)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, level, career_avg, high_game, total_games, team, rating, is_pro")
    .eq("id", id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: data.id,
    username: data.username,
    name: data.name,
    rank: data.rank,
    level: data.level,
    careerAvg: data.career_avg,
    highGame: data.high_game,
    totalGames: data.total_games,
    team: data.team,
    rating: data.rating,
    isPro: data.is_pro,
  });
});

router.patch("/users/me", async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(toSnake(parsed.data))
    .eq("id", req.userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(mapUser(data)));
});

function mapUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    authId: row.auth_id,
    username: row.username,
    name: row.name,
    rank: row.rank,
    level: row.level,
    xp: row.xp,
    xpToNext: row.xp_to_next,
    isPro: row.is_pro,
    careerAvg: row.career_avg,
    highGame: row.high_game,
    totalGames: row.total_games,
    team: row.team,
    rating: row.rating,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    authId: "auth_id",
    xpToNext: "xp_to_next",
    isPro: "is_pro",
    careerAvg: "career_avg",
    highGame: "high_game",
    totalGames: "total_games",
  };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] ?? k] = v;
  }
  return result;
}

export default router;
