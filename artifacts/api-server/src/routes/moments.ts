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

export function rankColor(rank: string): string {
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

async function formatMoment(row: Record<string, unknown>, userId: number) {
  const [likeRes, dislikeRes, saveRes, reactionRes] = await Promise.all([
    supabaseAdmin.from("moment_likes").select("id").eq("moment_id", row.id).eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("moment_dislikes").select("id").eq("moment_id", row.id).eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("moment_saves").select("id").eq("moment_id", row.id).eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("moment_reactions").select("emoji").eq("moment_id", row.id).eq("user_id", userId).maybeSingle(),
  ]);

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
    comments: row.comment_count ?? row.comments ?? 0,
    dislikes: row.dislike_count ?? 0,
    saves: row.save_count ?? 0,
    tags: (row.tags as string[]) ?? [],
    initials: row.initials,
    avatarColor: row.avatar_color,
    mediaUrl: row.media_url ?? null,
    mediaType: row.media_type ?? null,
    createdAt: row.created_at,
    liked: !!likeRes.data,
    disliked: !!dislikeRes.data,
    saved: !!saveRes.data,
    userReaction: (reactionRes.data as { emoji: string } | null)?.emoji ?? null,
    timeAgo: timeAgo(new Date(row.created_at as string)),
  };
}

router.get("/moments/search", async (req, res): Promise<void> => {
  const q = (req.query.q as string ?? "").trim();
  const tag = (req.query.tag as string ?? "").trim().toLowerCase().replace(/^#/, "");

  let query = supabaseAdmin
    .from("moments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (tag) {
    query = query.contains("tags", [tag]);
  } else if (q) {
    query = query.ilike("content", `%${q}%`);
  } else {
    res.json([]);
    return;
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const formatted = await Promise.all(
    (data ?? []).map((m: Record<string, unknown>) => formatMoment(m, req.userId))
  );

  res.json(formatted);
});

router.get("/moments", async (req, res): Promise<void> => {
  const tag = (req.query.tag as string ?? "").trim().toLowerCase().replace(/^#/, "");

  let query = supabaseAdmin
    .from("moments")
    .select("*")
    .order("created_at", { ascending: false });

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const formatted = await Promise.all(
    (data ?? []).map((m: Record<string, unknown>) => formatMoment(m, req.userId))
  );

  res.json(formatted);
});

router.get("/moments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("moments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  res.json(await formatMoment(data as Record<string, unknown>, req.userId));
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

  // Extract hashtags from content
  const tagMatches = (parsed.data.content as string).match(/#(\w+)/g) ?? [];
  const extractedTags = tagMatches.map((t) => t.slice(1).toLowerCase());
  const bodyTags: string[] = Array.isArray((parsed.data as Record<string, unknown>).tags)
    ? ((parsed.data as Record<string, unknown>).tags as string[])
    : [];
  const tags = [...new Set([...extractedTags, ...bodyTags])];

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
      comment_count: 0,
      dislike_count: 0,
      save_count: 0,
      tags,
      initials: user.username.substring(0, 2),
      avatar_color: "#1a3c2a",
      media_url:
        typeof (req.body as Record<string, unknown>)?.mediaUrl === "string"
          ? ((req.body as Record<string, unknown>).mediaUrl as string)
          : null,
      media_type:
        typeof (req.body as Record<string, unknown>)?.mediaType === "string"
          ? ((req.body as Record<string, unknown>).mediaType as string)
          : null,
    })
    .select()
    .single();

  if (insertErr || !moment) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  res.status(201).json(
    await formatMoment(moment as Record<string, unknown>, req.userId)
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
    // Remove dislike if exists
    await supabaseAdmin.from("moment_dislikes")
      .delete().eq("moment_id", params.data.id).eq("user_id", req.userId);

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

    // Notify moment owner (skip if liking own post)
    if ((moment as Record<string, unknown>).user_id !== req.userId) {
      const { data: liker } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("id", req.userId)
        .single();
      if (liker) {
        await supabaseAdmin.from("notifications").insert({
          user_id: (moment as Record<string, unknown>).user_id,
          type: "like",
          from_user_id: req.userId,
          from_username: (liker as { username: string }).username,
          from_initials: (liker as { username: string }).username.substring(0, 2).toUpperCase(),
          from_avatar_color: "#1a3c2a",
          moment_id: params.data.id,
          moment_preview: ((moment as Record<string, unknown>).content as string).substring(0, 80),
          read: false,
        });
      }
    }

    res.json(await formatMoment(updated as Record<string, unknown>, req.userId));
    return;
  }

  res.json(await formatMoment(moment as Record<string, unknown>, req.userId));
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

    res.json(await formatMoment(updated as Record<string, unknown>, req.userId));
    return;
  }

  res.json(await formatMoment(moment as Record<string, unknown>, req.userId));
});

router.post("/moments/:id/share", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { userIds, message } = req.body as { userIds?: number[]; message?: string };
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({ error: "userIds required" });
    return;
  }

  const { data: moment } = await supabaseAdmin
    .from("moments")
    .select("content, user_id")
    .eq("id", momentId)
    .single();

  if (!moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: sharer } = await supabaseAdmin
    .from("users")
    .select("username")
    .eq("id", req.userId)
    .single();

  if (!sharer) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const sharerUsername = (sharer as { username: string }).username;
  const preview = ((moment as Record<string, unknown>).content as string).substring(0, 80);

  await Promise.all(
    userIds.map((toUserId) =>
      supabaseAdmin.from("notifications").insert({
        user_id: toUserId,
        type: "share",
        from_user_id: req.userId,
        from_username: sharerUsername,
        from_initials: sharerUsername.substring(0, 2).toUpperCase(),
        from_avatar_color: "#1a3c2a",
        moment_id: momentId,
        moment_preview: preview,
        message: message ? message.substring(0, 120) : null,
        read: false,
      }),
    ),
  );

  res.json({ ok: true, sent: userIds.length });
});

export default router;
