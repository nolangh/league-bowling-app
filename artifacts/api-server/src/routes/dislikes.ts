import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

router.post("/moments/:id/dislike", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const { data: moment, error: momentErr } = await supabaseAdmin
    .from("moments")
    .select("id, dislike_count")
    .eq("id", momentId)
    .single();

  if (momentErr || !moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("moment_dislikes")
    .select("id")
    .eq("user_id", req.userId)
    .eq("moment_id", momentId)
    .maybeSingle();

  if (existing) {
    res.json({ disliked: true, dislikes: moment.dislike_count });
    return;
  }

  // Remove any existing like when disliking
  const { data: likeRow } = await supabaseAdmin
    .from("moment_likes")
    .select("id")
    .eq("user_id", req.userId)
    .eq("moment_id", momentId)
    .maybeSingle();

  if (likeRow) {
    await supabaseAdmin.from("moment_likes").delete()
      .eq("user_id", req.userId).eq("moment_id", momentId);
    const { data: m } = await supabaseAdmin.from("moments").select("likes").eq("id", momentId).single();
    if (m) {
      await supabaseAdmin.from("moments").update({ likes: Math.max(0, m.likes - 1) }).eq("id", momentId);
    }
  }

  await supabaseAdmin.from("moment_dislikes").insert({ user_id: req.userId, moment_id: momentId });

  const { data: updated } = await supabaseAdmin
    .from("moments")
    .update({ dislike_count: (moment.dislike_count ?? 0) + 1 })
    .eq("id", momentId)
    .select("dislike_count")
    .single();

  res.json({ disliked: true, dislikes: updated?.dislike_count ?? (moment.dislike_count ?? 0) + 1 });
});

router.delete("/moments/:id/dislike", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const { data: deleted } = await supabaseAdmin
    .from("moment_dislikes")
    .delete()
    .eq("user_id", req.userId)
    .eq("moment_id", momentId)
    .select();

  if (deleted && deleted.length > 0) {
    const { data: moment } = await supabaseAdmin
      .from("moments").select("dislike_count").eq("id", momentId).single();
    if (moment) {
      await supabaseAdmin
        .from("moments")
        .update({ dislike_count: Math.max(0, (moment.dislike_count ?? 1) - 1) })
        .eq("id", momentId);
    }
  }

  res.json({ disliked: false });
});

export default router;
