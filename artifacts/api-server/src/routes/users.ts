import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("users").select("*").eq("id", req.userId).single();

  if (error || !data) { res.status(404).json({ error: "User not found" }); return; }
  res.json(mapUser(data));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, level, career_avg, high_game, total_games, team, bsr, is_pro")
    .eq("id", id)
    .single();

  if (error || !data) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    id:         data.id,
    username:   data.username,
    name:       data.name,
    rank:       data.rank,
    level:      data.level,
    careerAvg:  data.career_avg,
    highGame:   data.high_game,
    totalGames: data.total_games,
    team:       data.team,
    bsr:        data.bsr ?? 1200,
    isPro:      data.is_pro,
  });
});

router.patch("/users/me", async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update = toSnake(parsed.data);

  // Home alley fields (passed through outside Zod schema)
  const body = req.body as Record<string, unknown>;
  if ("homeAlleyName" in body) {
    const v = body.homeAlleyName;
    update.home_alley_name = typeof v === "string" && v.length > 0 && v.length <= 200 ? v : null;
  }
  if ("homeAlleyLat" in body) {
    const v = body.homeAlleyLat;
    update.home_alley_lat = typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90 ? v : null;
  }
  if ("homeAlleyLng" in body) {
    const v = body.homeAlleyLng;
    update.home_alley_lng = typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180 ? v : null;
  }
  if ("homeAlleyOsmId" in body) {
    const v = body.homeAlleyOsmId;
    update.home_alley_osm_id = typeof v === "string" && v.length > 0 && v.length <= 100 ? v : null;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", req.userId)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: "User not found" }); return; }
  res.json(mapUser(data));
});

function mapUser(row: Record<string, unknown>) {
  return {
    id:             row.id,
    authId:         row.auth_id,
    username:       row.username,
    name:           row.name,
    rank:           row.rank,
    level:          row.level,
    xp:             row.xp,
    xpToNext:       row.xp_to_next,
    isPro:          row.is_pro,
    careerAvg:      row.career_avg,
    highGame:       row.high_game,
    totalGames:     row.total_games,
    team:           row.team,
    bsr:            (row.bsr as number) ?? 1200,
    wins:           (row.wins as number) ?? 0,
    losses:         (row.losses as number) ?? 0,
    revRate:        row.rev_rate ?? null,
    ballSpeed:      row.ball_speed ?? null,
    axisTilt:       row.axis_tilt ?? null,
    axisRotation:   row.axis_rotation ?? null,
    papOver:        row.pap_over ?? null,
    papUp:          row.pap_up ?? null,
    releaseStyle:   row.release_style ?? null,
    gripStyle:      row.grip_style ?? null,
    dominantHand:   row.dominant_hand ?? null,
    homeAlleyName:  row.home_alley_name ?? null,
    homeAlleyLat:   row.home_alley_lat ?? null,
    homeAlleyLng:   row.home_alley_lng ?? null,
    homeAlleyOsmId: row.home_alley_osm_id ?? null,
    reportSchedule: (row.report_schedule as string | null) ?? null,
    reportEmail:    (row.report_email as string | null) ?? null,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    authId:       "auth_id",
    xpToNext:     "xp_to_next",
    isPro:        "is_pro",
    careerAvg:    "career_avg",
    highGame:     "high_game",
    totalGames:   "total_games",
    revRate:      "rev_rate",
    ballSpeed:    "ball_speed",
    axisTilt:     "axis_tilt",
    axisRotation: "axis_rotation",
    papOver:      "pap_over",
    papUp:        "pap_up",
    releaseStyle: "release_style",
    gripStyle:    "grip_style",
    dominantHand: "dominant_hand",
  };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] ?? k] = v;
  }
  return result;
}

export default router;
