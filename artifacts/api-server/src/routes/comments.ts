import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { timeAgo } from "../lib/timeAgo";

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

router.get("/moments/:id/comments", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("moment_id", momentId)
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const result = (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id,
    momentId: c.moment_id,
    userId: c.user_id,
    username: c.username,
    initials: c.initials,
    avatarColor: c.avatar_color,
    rank: c.rank,
    rankColor: c.rank_color,
    content: c.content,
    timeAgo: timeAgo(new Date(c.created_at as string)),
    createdAt: c.created_at,
    isOwn: c.user_id === req.userId,
  }));

  res.json(result);
});

router.post("/moments/:id/comments", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const { content } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const { data: moment, error: momentErr } = await supabaseAdmin
    .from("moments")
    .select("id, comment_count")
    .eq("id", momentId)
    .single();

  if (momentErr || !moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("username, rank, is_pro")
    .eq("id", req.userId)
    .single();

  if (userErr || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { data: comment, error: insertErr } = await supabaseAdmin
    .from("comments")
    .insert({
      moment_id: momentId,
      user_id: req.userId,
      username: user.username,
      initials: user.username.substring(0, 2),
      avatar_color: "#1a3c2a",
      rank: user.rank,
      rank_color: getRankColor(user.rank),
      content: content.trim(),
    })
    .select()
    .single();

  if (insertErr || !comment) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  await supabaseAdmin
    .from("moments")
    .update({ comment_count: (moment.comment_count ?? 0) + 1 })
    .eq("id", momentId);

  res.status(201).json({
    id: comment.id,
    momentId: comment.moment_id,
    userId: comment.user_id,
    username: comment.username,
    initials: comment.initials,
    avatarColor: comment.avatar_color,
    rank: comment.rank,
    rankColor: comment.rank_color,
    content: comment.content,
    timeAgo: "just now",
    createdAt: comment.created_at,
    isOwn: true,
  });
});

router.delete("/moments/:id/comments/:commentId", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  const commentId = parseInt(req.params.commentId);
  if (isNaN(momentId) || isNaN(commentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .eq("moment_id", momentId)
    .single();

  if (fetchErr || !existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: "Cannot delete another user's comment" });
    return;
  }

  await supabaseAdmin.from("comments").delete().eq("id", commentId);

  const { data: moment } = await supabaseAdmin
    .from("moments")
    .select("comment_count")
    .eq("id", momentId)
    .single();

  if (moment) {
    await supabaseAdmin
      .from("moments")
      .update({ comment_count: Math.max(0, (moment.comment_count ?? 1) - 1) })
      .eq("id", momentId);
  }

  res.json({ deleted: true });
});

export default router;
