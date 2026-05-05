import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

function mapFriend(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.friend_user_id,
    username: row.username,
    name: row.name,
    rank: row.rank,
    rankColor: row.rank_color,
    rating: row.rating,
    careerAvg: row.career_avg,
    highGame: row.high_game,
    isPro: row.is_pro,
    initials: (row.username as string).substring(0, 2),
    avatarColor: "#1a3c2a",
    friendsSince: row.created_at ? timeAgo(new Date(row.created_at as string)) : null,
  };
}

router.get("/friends", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("friends")
    .select("id, created_at, requester_id, addressee_id")
    .or(`requester_id.eq.${req.userId},addressee_id.eq.${req.userId}`)
    .eq("status", "accepted");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const friendIds = (data ?? []).map((f: Record<string, unknown>) =>
    f.requester_id === req.userId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) {
    res.json([]);
    return;
  }

  const { data: users, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, career_avg, high_game, rating, is_pro")
    .in("id", friendIds);

  if (usersErr) {
    res.status(500).json({ error: usersErr.message });
    return;
  }

  const friendsMap = new Map((data ?? []).map((f: Record<string, unknown>) => {
    const fid = f.requester_id === req.userId ? f.addressee_id : f.requester_id;
    return [fid, f];
  }));

  const result = (users ?? []).map((u: Record<string, unknown>) => {
    const rankColor = getRankColor(u.rank as string);
    const friendRow = friendsMap.get(u.id) ?? {};
    return {
      id: (friendRow as Record<string, unknown>).id,
      userId: u.id,
      username: u.username,
      name: u.name,
      rank: u.rank,
      rankColor,
      rating: u.rating,
      careerAvg: u.career_avg,
      highGame: u.high_game,
      isPro: u.is_pro,
      initials: (u.username as string).substring(0, 2),
      avatarColor: "#1a3c2a",
      friendsSince: (friendRow as Record<string, unknown>).created_at
        ? timeAgo(new Date((friendRow as Record<string, unknown>).created_at as string))
        : null,
    };
  });

  res.json(result);
});

router.get("/friends/requests", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("friends")
    .select("id, requester_id, created_at")
    .eq("addressee_id", req.userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data || data.length === 0) {
    res.json([]);
    return;
  }

  const requesterIds = data.map((f: Record<string, unknown>) => f.requester_id);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, career_avg, high_game, rating, is_pro")
    .in("id", requesterIds);

  const usersMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id, u]));

  const result = data.map((f: Record<string, unknown>) => {
    const u = usersMap.get(f.requester_id) ?? {} as Record<string, unknown>;
    return {
      requestId: f.id,
      userId: f.requester_id,
      username: u.username,
      name: u.name,
      rank: u.rank,
      rankColor: getRankColor(u.rank as string),
      rating: u.rating,
      careerAvg: u.career_avg,
      isPro: u.is_pro,
      initials: ((u.username as string) ?? "??").substring(0, 2),
      avatarColor: "#1a3c2a",
      timeAgo: timeAgo(new Date(f.created_at as string)),
    };
  });

  res.json(result);
});

router.post("/friends/:userId/request", async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (targetId === req.userId) {
    res.status(400).json({ error: "Cannot friend yourself" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("friends")
    .select("id, status")
    .or(
      `and(requester_id.eq.${req.userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${req.userId})`
    )
    .maybeSingle();

  if (existing) {
    res.json({ status: (existing as Record<string, unknown>).status, alreadyExists: true });
    return;
  }

  const { error } = await supabaseAdmin.from("friends").insert({
    requester_id: req.userId,
    addressee_id: targetId,
    status: "pending",
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ status: "pending" });
});

router.post("/friends/:userId/accept", async (req, res): Promise<void> => {
  const requesterId = parseInt(req.params.userId);
  if (isNaN(requesterId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("friends")
    .update({ status: "accepted" })
    .eq("requester_id", requesterId)
    .eq("addressee_id", req.userId)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Friend request not found" });
    return;
  }

  res.json({ status: "accepted" });
});

router.delete("/friends/:userId", async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  await supabaseAdmin
    .from("friends")
    .delete()
    .or(
      `and(requester_id.eq.${req.userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${req.userId})`
    );

  res.json({ removed: true });
});

router.get("/users/search", async (req, res): Promise<void> => {
  const q = (req.query.q as string ?? "").trim();
  if (!q || q.length < 2) {
    res.json([]);
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, rating, career_avg, high_game, is_pro")
    .ilike("username", `%${q}%`)
    .neq("id", req.userId)
    .limit(20);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const userIds = (data ?? []).map((u: Record<string, unknown>) => u.id);
  let friendStatuses: Map<number, string> = new Map();

  if (userIds.length > 0) {
    const { data: friendRows } = await supabaseAdmin
      .from("friends")
      .select("requester_id, addressee_id, status")
      .or(
        userIds
          .map((id) =>
            `and(requester_id.eq.${req.userId},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${req.userId})`
          )
          .join(",")
      );

    for (const f of friendRows ?? []) {
      const otherId = f.requester_id === req.userId ? f.addressee_id : f.requester_id;
      friendStatuses.set(otherId, f.status);
    }
  }

  const result = (data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    rank: u.rank,
    rankColor: getRankColor(u.rank as string),
    rating: u.rating,
    careerAvg: u.career_avg,
    highGame: u.high_game,
    isPro: u.is_pro,
    initials: (u.username as string).substring(0, 2),
    avatarColor: "#1a3c2a",
    friendStatus: friendStatuses.get(u.id as number) ?? null,
  }));

  res.json(result);
});

function getRankColor(rank: string): string {
  const colors: Record<string, string> = {
    Rookie: "#a0a0a0", Amateur: "#a0a0a0",
    Intermediate: "#a8c870", Advanced: "#a8c870",
    Expert: "#f5c842", Elite: "#f5c842",
    "Diamond IV": "#60c8ff", "Diamond III": "#60c8ff", "Diamond II": "#60c8ff", "Diamond I": "#60c8ff",
    "Platinum II": "#c8a8e8", "Platinum I": "#c8a8e8",
    Legend: "#9fe870", Kingpin: "#ff6b35",
  };
  return colors[rank] ?? "#a0a0a0";
}

export default router;
