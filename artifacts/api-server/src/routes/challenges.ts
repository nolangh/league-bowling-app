import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
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

function mapChallenge(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    rank: row.rank,
    rankColor: row.rank_color,
    postedScore: row.posted_score,
    stake: row.stake,
    status: row.status,
    initials: row.initials,
    avatarColor: row.avatar_color,
    isPro: row.is_pro,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeAgo: timeAgo(new Date(row.created_at as string)),
  };
}

router.get("/challenges", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .neq("user_id", req.userId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListChallengesResponse.parse((data ?? []).map(mapChallenge)));
});

router.get("/challenges/my", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListMyChallengesResponse.parse((data ?? []).map(mapChallenge)));
});

router.post("/challenges", async (req, res): Promise<void> => {
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (userErr || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { data: challenge, error: insertErr } = await supabaseAdmin
    .from("challenges")
    .insert({
      user_id: req.userId,
      username: user.username,
      rank: user.rank,
      rank_color: rankColor(user.rank),
      posted_score: parsed.data.postedScore,
      stake: parsed.data.stake,
      status: "open",
      initials: user.username.substring(0, 2),
      avatar_color: "#1a3c2a",
      is_pro: user.is_pro,
    })
    .select()
    .single();

  if (insertErr || !challenge) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  res.status(201).json(ListChallengesResponseItem.parse(mapChallenge(challenge)));
});

router.post("/challenges/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptChallengeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (fetchErr || !challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("challenges")
    .update({ status: "active" })
    .eq("id", params.data.id)
    .select()
    .single();

  if (updateErr || !updated) {
    res.status(500).json({ error: updateErr?.message ?? "Update failed" });
    return;
  }

  res.json(AcceptChallengeResponse.parse(mapChallenge(updated)));
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
