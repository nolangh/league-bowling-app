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
    acceptorId: row.acceptor_id ?? null,
    acceptorUsername: row.acceptor_username ?? null,
    winnerId: row.winner_id ?? null,
    completedAt: row.completed_at ?? null,
  };
}

// GET /challenges — open challenges from other users
router.get("/challenges", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .neq("user_id", req.userId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(ListChallengesResponse.parse((data ?? []).map(mapChallenge)));
});

// GET /challenges/my — challenges posted by current user
router.get("/challenges/my", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(ListMyChallengesResponse.parse((data ?? []).map(mapChallenge)));
});

// GET /challenges/accepted — active challenges accepted by current user
router.get("/challenges/accepted", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("acceptor_id", req.userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map(mapChallenge));
});

// GET /challenges/completed — completed challenges (as creator or acceptor)
router.get("/challenges/completed", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("status", "completed")
    .or(`user_id.eq.${req.userId},acceptor_id.eq.${req.userId}`)
    .order("completed_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(
    (data ?? []).map((row) => ({
      ...mapChallenge(row),
      result: row.winner_id === req.userId ? "won" : "lost",
    }))
  );
});

// POST /challenges — create a new challenge
router.post("/challenges", async (req, res): Promise<void> => {
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (userErr || !user) { res.status(404).json({ error: "User not found" }); return; }

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
      initials: user.username.substring(0, 2).toUpperCase(),
      avatar_color: "#1a3c2a",
      is_pro: user.is_pro,
    })
    .select()
    .single();

  if (insertErr || !challenge) { res.status(500).json({ error: insertErr?.message ?? "Insert failed" }); return; }
  res.status(201).json(ListChallengesResponseItem.parse(mapChallenge(challenge)));
});

// DELETE /challenges/:id — delete own open challenge
router.delete("/challenges/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
  if (challenge.user_id !== req.userId) { res.status(403).json({ error: "Not your challenge" }); return; }
  if (challenge.status !== "open") { res.status(400).json({ error: "Can only delete open challenges" }); return; }

  const { error: deleteErr } = await supabaseAdmin.from("challenges").delete().eq("id", id);
  if (deleteErr) { res.status(500).json({ error: deleteErr.message }); return; }
  res.json({ success: true });
});

// POST /challenges/:id/accept — accept an open challenge
router.post("/challenges/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptChallengeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  const { data: acceptorUser } = await supabaseAdmin
    .from("users")
    .select("username")
    .eq("id", req.userId)
    .single();

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("challenges")
    .update({
      status: "active",
      acceptor_id: req.userId,
      acceptor_username: acceptorUser?.username ?? null,
    })
    .eq("id", params.data.id)
    .select()
    .single();

  if (updateErr || !updated) { res.status(500).json({ error: updateErr?.message ?? "Update failed" }); return; }
  res.json(AcceptChallengeResponse.parse(mapChallenge(updated)));
});

// POST /challenges/:id/complete — mark challenge as completed with result
router.post("/challenges/:id/complete", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { result } = req.body;
  if (!["won", "lost"].includes(result)) {
    res.status(400).json({ error: "result must be 'won' or 'lost'" });
    return;
  }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  const isCreator = challenge.user_id === req.userId;
  const isAcceptor = challenge.acceptor_id === req.userId;
  if (!isCreator && !isAcceptor) {
    res.status(403).json({ error: "Not a party to this challenge" });
    return;
  }

  const otherUserId = isCreator ? challenge.acceptor_id : challenge.user_id;
  const winnerId: number = result === "won" ? req.userId : otherUserId;
  const loserId: number = result === "won" ? otherUserId : req.userId;

  await supabaseAdmin.from("challenges").update({
    status: "completed",
    winner_id: winnerId,
    completed_at: new Date().toISOString(),
  }).eq("id", id);

  if (winnerId) {
    const { data: winner } = await supabaseAdmin.from("users").select("wins, earnings").eq("id", winnerId).single();
    if (winner) {
      await supabaseAdmin.from("users").update({
        wins: (winner.wins ?? 0) + 1,
        earnings: parseFloat(String(winner.earnings ?? 0)) + challenge.stake,
      }).eq("id", winnerId);
    }
  }

  if (loserId) {
    const { data: loser } = await supabaseAdmin.from("users").select("losses, earnings").eq("id", loserId).single();
    if (loser) {
      await supabaseAdmin.from("users").update({
        losses: (loser.losses ?? 0) + 1,
        earnings: parseFloat(String(loser.earnings ?? 0)) - challenge.stake,
      }).eq("id", loserId);
    }
  }

  const { data: updated } = await supabaseAdmin.from("challenges").select("*").eq("id", id).single();
  res.json({ ...mapChallenge(updated ?? challenge), result });
});

function rankColor(rank: string): string {
  const colors: Record<string, string> = {
    Rookie: "#a0a0a0", Amateur: "#a0a0a0",
    Intermediate: "#a8c870", Advanced: "#a8c870",
    Expert: "#f5c842", Elite: "#f5c842",
    "Diamond IV": "#60c8ff", "Diamond III": "#60c8ff",
    "Diamond II": "#60c8ff", "Diamond I": "#60c8ff",
    "Platinum II": "#c8a8e8", "Platinum I": "#c8a8e8",
    Legend: "#9fe870", Kingpin: "#ff6b35",
  };
  return colors[rank] ?? "#a0a0a0";
}

export default router;
