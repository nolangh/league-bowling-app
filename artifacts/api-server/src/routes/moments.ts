import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
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

async function formatMoment(row: Record<string, unknown>, userId: number) {
  const { data: like } = await supabaseAdmin
    .from("moment_likes")
    .select("id")
    .eq("moment_id", row.id)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    rank: row.rank,
    rankColor: row.rank_color,
    content: row.content,
    score: row.score ?? null,
    type: row.type,
    likes: row.likes,
    comments: row.comments,
    initials: row.initials,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    liked: !!like,
    timeAgo: timeAgo(new Date(row.created_at as string)),
  };
}

router.get("/moments", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("moments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const formatted = await Promise.all(
    (data ?? []).map((m: Record<string, unknown>) => formatMoment(m, req.userId))
  );

  res.json(ListMomentsResponse.parse(formatted));
});

router.post("/moments", async (req, res): Promise<void> => {
  const parsed = CreateMomentBody.safeParse(req.body);
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

  const { data: moment, error: insertErr } = await supabaseAdmin
    .from("moments")
    .insert({
      user_id: req.userId,
      username: user.username,
      rank: user.rank,
      rank_color: rankColor(user.rank),
      content: parsed.data.content,
      score: parsed.data.score ?? null,
      type: parsed.data.type,
      likes: 0,
      comments: 0,
      initials: user.username.substring(0, 2),
      avatar_color: "#1a3c2a",
    })
    .select()
    .single();

  if (insertErr || !moment) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

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

  const { data: moment, error: fetchErr } = await supabaseAdmin
    .from("moments")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (fetchErr || !moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: existingLike } = await supabaseAdmin
    .from("moment_likes")
    .select("id")
    .eq("moment_id", params.data.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!existingLike) {
    await supabaseAdmin.from("moment_likes").insert({
      moment_id: params.data.id,
      user_id: req.userId,
    });

    const { data: updated } = await supabaseAdmin
      .from("moments")
      .update({ likes: moment.likes + 1 })
      .eq("id", params.data.id)
      .select()
      .single();

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

  const { data: moment, error: fetchErr } = await supabaseAdmin
    .from("moments")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (fetchErr || !moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: deleted } = await supabaseAdmin
    .from("moment_likes")
    .delete()
    .eq("moment_id", params.data.id)
    .eq("user_id", req.userId)
    .select();

  if (deleted && deleted.length > 0) {
    const newLikes = Math.max(0, moment.likes - 1);
    const { data: updated } = await supabaseAdmin
      .from("moments")
      .update({ likes: newLikes })
      .eq("id", params.data.id)
      .select()
      .single();

    res.json(UnlikeMomentResponse.parse(await formatMoment(updated, req.userId)));
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
