import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

// ── Rank / BSR helpers ────────────────────────────────────────────────────────

export function bsrToRank(bsr: number): string {
  if (bsr >= 1800) return "Legend";
  if (bsr >= 1600) return "Perfect";
  if (bsr >= 1400) return "Turkey";
  if (bsr >= 1200) return "Strike";
  if (bsr >= 1000) return "Spare";
  return "Gutter";
}

export function rankColor(rank: string): string {
  const map: Record<string, string> = {
    Gutter:  "#a0a0a0",
    Spare:   "#a8d8a8",
    Strike:  "#9fe870",
    Turkey:  "#f5c842",
    Perfect: "#60c8ff",
    Legend:  "#ff6b35",
  };
  return map[rank] ?? "#a0a0a0";
}

// Standard Elo: K=40 for placement (<10 challenge matches), else K=28
function calculateElo(
  winnerBsr: number, loserBsr: number,
  winnerMatches: number, loserMatches: number,
) {
  const kW = winnerMatches < 10 ? 40 : 28;
  const kL = loserMatches  < 10 ? 40 : 28;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserBsr - winnerBsr) / 400));
  const winnerChange  = Math.round(kW * (1 - expectedWinner));
  const loserChange   = Math.round(kL * (0 - (1 - expectedWinner)));
  return { winnerChange, loserChange };
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapChallenge(row: Record<string, unknown>) {
  return {
    id:                      row.id,
    userId:                  row.user_id,
    username:                row.username,
    rank:                    row.rank,
    rankColor:               row.rank_color,
    postedScore:             row.posted_score,
    posterBsr:               row.poster_bsr ?? 1200,
    notes:                   row.notes ?? null,
    scorecardPhotoUrl:       row.scorecard_photo_url ?? null,
    status:                  row.status,
    initials:                row.initials,
    avatarColor:             row.avatar_color,
    isPro:                   row.is_pro,
    createdAt:               row.created_at,
    timeAgo:                 timeAgo(new Date(row.created_at as string)),
    acceptorId:              row.acceptor_id ?? null,
    acceptorUsername:        row.acceptor_username ?? null,
    acceptorBsr:             row.acceptor_bsr ?? null,
    acceptorFinalScore:      row.acceptor_final_score ?? null,
    acceptorScorecardPhotoUrl: row.acceptor_scorecard_photo_url ?? null,
    winnerId:                row.winner_id ?? null,
    completedAt:             row.completed_at ?? null,
    winnerBsrChange:         row.winner_bsr_change ?? null,
    loserBsrChange:          row.loser_bsr_change ?? null,
  };
}

// ── GET /challenges ── open challenges within ±300 BSR ───────────────────────

router.get("/challenges", async (req, res): Promise<void> => {
  const { data: me } = await supabaseAdmin
    .from("users").select("bsr").eq("id", req.userId).single();
  const myBsr = (me?.bsr as number) ?? 1200;

  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .neq("user_id", req.userId)
    .eq("status", "open")
    .gte("poster_bsr", myBsr - 300)
    .lte("poster_bsr", myBsr + 300)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map(mapChallenge));
});

// ── GET /challenges/my ───────────────────────────────────────────────────────

router.get("/challenges/my", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map(mapChallenge));
});

// ── GET /challenges/accepted ─────────────────────────────────────────────────

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

// ── GET /challenges/completed ────────────────────────────────────────────────

router.get("/challenges/completed", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("status", "completed")
    .or(`user_id.eq.${req.userId},acceptor_id.eq.${req.userId}`)
    .order("completed_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json(
    (data ?? []).map((row) => {
      const mapped = mapChallenge(row);
      const isWinner = row.winner_id === req.userId;
      return {
        ...mapped,
        result: isWinner ? "won" : "lost",
        // BSR change from caller's perspective
        bsrChange: isWinner
          ? (row.winner_bsr_change as number ?? 0)
          : (row.loser_bsr_change as number ?? 0),
      };
    }),
  );
});

// ── POST /challenges ─────────────────────────────────────────────────────────

router.post("/challenges", async (req, res): Promise<void> => {
  const { postedScore, notes, scorecardPhotoUrl } = req.body as {
    postedScore?: unknown; notes?: unknown; scorecardPhotoUrl?: unknown;
  };

  if (typeof postedScore !== "number" || postedScore < 0 || postedScore > 300) {
    res.status(400).json({ error: "postedScore must be 0–300" });
    return;
  }

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users").select("*").eq("id", req.userId).single();

  if (userErr || !user) { res.status(404).json({ error: "User not found" }); return; }

  const userBsr = (user.bsr as number) ?? 1200;
  const userRank = bsrToRank(userBsr);

  const { data: challenge, error: insertErr } = await supabaseAdmin
    .from("challenges")
    .insert({
      user_id:            req.userId,
      username:           user.username,
      rank:               userRank,
      rank_color:         rankColor(userRank),
      posted_score:       postedScore,
      poster_bsr:         userBsr,
      notes:              notes ?? null,
      scorecard_photo_url: scorecardPhotoUrl ?? null,
      status:             "open",
      initials:           (user.username as string).substring(0, 2).toUpperCase(),
      avatar_color:       "#1a3c2a",
      is_pro:             user.is_pro,
      // Legacy field — no longer used, kept for schema compat
      stake:              0,
    })
    .select()
    .single();

  if (insertErr || !challenge) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }
  res.status(201).json(mapChallenge(challenge));
});

// ── DELETE /challenges/:id ───────────────────────────────────────────────────

router.delete("/challenges/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges").select("*").eq("id", id).single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
  if (challenge.user_id !== req.userId) { res.status(403).json({ error: "Not your challenge" }); return; }
  if (challenge.status !== "open") { res.status(400).json({ error: "Can only delete open challenges" }); return; }

  const { error: deleteErr } = await supabaseAdmin.from("challenges").delete().eq("id", id);
  if (deleteErr) { res.status(500).json({ error: deleteErr.message }); return; }
  res.json({ success: true });
});

// ── POST /challenges/:id/accept ──────────────────────────────────────────────

router.post("/challenges/:id/accept", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { acceptorEmptyScorecardUrl } = req.body as { acceptorEmptyScorecardUrl?: string };

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges").select("*").eq("id", id).single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
  if (challenge.status !== "open") { res.status(400).json({ error: "Challenge is not open" }); return; }
  if (challenge.user_id === req.userId) { res.status(400).json({ error: "Cannot accept your own challenge" }); return; }

  const { data: acceptorUser } = await supabaseAdmin
    .from("users").select("username, bsr").eq("id", req.userId).single();

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("challenges")
    .update({
      status:                       "active",
      acceptor_id:                  req.userId,
      acceptor_username:            acceptorUser?.username ?? null,
      acceptor_bsr:                 (acceptorUser?.bsr as number) ?? 1200,
      acceptor_empty_scorecard_url: acceptorEmptyScorecardUrl ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr || !updated) {
    res.status(500).json({ error: updateErr?.message ?? "Update failed" });
    return;
  }
  res.json(mapChallenge(updated));
});

// ── POST /challenges/:id/complete ────────────────────────────────────────────
// Called by the acceptor when they finish their game.
// Body: { acceptorFinalScore: number, acceptorScorecardPhotoUrl?: string }
// Winner is determined by comparing scores. Elo updates both players' BSR.

router.post("/challenges/:id/complete", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { acceptorFinalScore, acceptorScorecardPhotoUrl } = req.body as {
    acceptorFinalScore?: unknown; acceptorScorecardPhotoUrl?: unknown;
  };

  if (typeof acceptorFinalScore !== "number" || acceptorFinalScore < 0 || acceptorFinalScore > 300) {
    res.status(400).json({ error: "acceptorFinalScore must be 0–300" });
    return;
  }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from("challenges").select("*").eq("id", id).single();

  if (fetchErr || !challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
  if (challenge.status !== "active") { res.status(400).json({ error: "Challenge is not active" }); return; }
  if (challenge.acceptor_id !== req.userId) {
    res.status(403).json({ error: "Only the acceptor can complete a challenge" });
    return;
  }

  const posterId   = challenge.user_id as number;
  const acceptorId = challenge.acceptor_id as number;
  const posterScore   = challenge.posted_score as number;
  const acceptorScore = acceptorFinalScore;

  // Higher score wins (tie → poster wins)
  const posterWon = posterScore >= acceptorScore;
  const winnerId  = posterWon ? posterId   : acceptorId;
  const loserId   = posterWon ? acceptorId : posterId;

  // Fetch both players for Elo
  const [{ data: posterUser }, { data: acceptorUser }] = await Promise.all([
    supabaseAdmin.from("users").select("bsr, wins, losses").eq("id", posterId).single(),
    supabaseAdmin.from("users").select("bsr, wins, losses").eq("id", acceptorId).single(),
  ]);

  const posterBsr   = (posterUser?.bsr   as number) ?? (challenge.poster_bsr   as number) ?? 1200;
  const acceptorBsr = (acceptorUser?.bsr as number) ?? (challenge.acceptor_bsr as number) ?? 1200;
  const posterMatches   = ((posterUser?.wins   as number) ?? 0) + ((posterUser?.losses   as number) ?? 0);
  const acceptorMatches = ((acceptorUser?.wins as number) ?? 0) + ((acceptorUser?.losses as number) ?? 0);

  const winnerBsr = posterWon ? posterBsr   : acceptorBsr;
  const loserBsr  = posterWon ? acceptorBsr : posterBsr;
  const winnerMatches = posterWon ? posterMatches   : acceptorMatches;
  const loserMatches  = posterWon ? acceptorMatches : posterMatches;

  const { winnerChange, loserChange } = calculateElo(winnerBsr, loserBsr, winnerMatches, loserMatches);

  const newWinnerBsr = winnerBsr + winnerChange;
  const newLoserBsr  = Math.max(0, loserBsr + loserChange);

  // Update challenge record
  await supabaseAdmin.from("challenges").update({
    status:                       "completed",
    acceptor_final_score:         acceptorScore,
    acceptor_scorecard_photo_url: acceptorScorecardPhotoUrl ?? null,
    winner_id:                    winnerId,
    completed_at:                 new Date().toISOString(),
    winner_bsr_change:            winnerChange,
    loser_bsr_change:             loserChange,
  }).eq("id", id);

  // Update winner
  await supabaseAdmin.from("users").update({
    bsr:    newWinnerBsr,
    rank:   bsrToRank(newWinnerBsr),
    wins:   ((posterWon ? posterUser?.wins : acceptorUser?.wins) as number ?? 0) + 1,
  }).eq("id", winnerId);

  // Update loser
  await supabaseAdmin.from("users").update({
    bsr:    newLoserBsr,
    rank:   bsrToRank(newLoserBsr),
    losses: ((posterWon ? acceptorUser?.losses : posterUser?.losses) as number ?? 0) + 1,
  }).eq("id", loserId);

  const { data: updated } = await supabaseAdmin.from("challenges").select("*").eq("id", id).single();
  const mapped = mapChallenge(updated ?? challenge);
  const callerWon = winnerId === req.userId;

  res.json({
    ...mapped,
    result:    callerWon ? "won" : "lost",
    bsrChange: callerWon ? winnerChange : loserChange,
  });
});

export default router;
