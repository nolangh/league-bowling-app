import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import {
  ListLeaguesResponse,
  JoinLeagueParams,
  JoinLeagueResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leagues", async (req, res): Promise<void> => {
  const { data: leagues, error } = await supabaseAdmin
    .from("leagues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { data: memberships } = await supabaseAdmin
    .from("league_memberships")
    .select("league_id")
    .eq("user_id", req.userId);

  const joinedIds = new Set((memberships ?? []).map((m: { league_id: number }) => m.league_id));

  const formatted = (leagues ?? []).map((l: Record<string, unknown>) => ({
    ...mapLeague(l),
    joined: joinedIds.has(l.id as number),
  }));

  res.json(ListLeaguesResponse.parse(formatted));
});

router.post("/leagues/:id/join", async (req, res): Promise<void> => {
  const params = JoinLeagueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: league, error: leagueErr } = await supabaseAdmin
    .from("leagues")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (leagueErr || !league) {
    res.status(404).json({ error: "League not found" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("league_memberships")
    .select("id")
    .eq("league_id", params.data.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("league_memberships").insert({
      league_id: params.data.id,
      user_id: req.userId,
      status: "member",
    });

    const { data: updated } = await supabaseAdmin
      .from("leagues")
      .update({ members: league.members + 1 })
      .eq("id", params.data.id)
      .select()
      .single();

    res.json(JoinLeagueResponse.parse({ ...mapLeague(updated), joined: true }));
    return;
  }

  res.json(JoinLeagueResponse.parse({ ...mapLeague(league), joined: true }));
});

function mapLeague(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    members: row.members,
    type: row.type,
    level: row.level,
    avgScore: row.avg_score,
    weeklyChallenge: row.weekly_challenge ?? null,
    createdAt: row.created_at,
  };
}

export default router;
