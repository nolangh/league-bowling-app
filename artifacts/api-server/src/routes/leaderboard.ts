import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

function getRankColor(rank: string): string {
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

router.get("/leaderboard", async (req, res): Promise<void> => {
  const filter = (req.query.filter as string) ?? "global";
  const q = (req.query.q as string ?? "").trim();

  let query = supabaseAdmin
    .from("users")
    .select("id, username, name, rank, rating, career_avg, high_game, total_games, is_pro, team")
    .order("rating", { ascending: false })
    .limit(100);

  if (filter === "team") {
    const { data: me } = await supabaseAdmin
      .from("users")
      .select("team")
      .eq("id", req.userId)
      .single();
    if (me?.team && me.team !== "Solo") {
      query = query.eq("team", me.team);
    }
  } else if (filter === "friends") {
    const { data: friendRows } = await supabaseAdmin
      .from("friends")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${req.userId},addressee_id.eq.${req.userId}`)
      .eq("status", "accepted");

    const friendIds = [
      req.userId,
      ...((friendRows ?? []) as Record<string, unknown>[]).map((f) =>
        f.requester_id === req.userId ? f.addressee_id : f.requester_id
      ),
    ];
    query = query.in("id", friendIds);
  } else if (q) {
    query = query.ilike("username", `%${q}%`).limit(20);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const isMe = (row: Record<string, unknown>) => row.id === req.userId;

  const result = rows.map((u, index) => ({
    position: index + 1,
    id: u.id,
    username: u.username,
    name: u.name,
    rank: u.rank,
    rankColor: getRankColor(u.rank as string),
    rating: u.rating,
    careerAvg: u.career_avg,
    highGame: u.high_game,
    totalGames: u.total_games,
    isPro: u.is_pro,
    team: u.team,
    initials: (u.username as string).substring(0, 2),
    avatarColor: "#1a3c2a",
    isMe: isMe(u),
  }));

  res.json(result);
});

export default router;
