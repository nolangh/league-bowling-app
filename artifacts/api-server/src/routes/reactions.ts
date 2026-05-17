import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

const VALID_EMOJIS = ["❤️", "🔥", "🎳", "👏"];

router.get("/moments/:id/reactions", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("moment_reactions")
    .select("emoji")
    .eq("moment_id", momentId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { emoji: string }[]) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
  }

  const { data: userRow } = await supabaseAdmin
    .from("moment_reactions")
    .select("emoji")
    .eq("moment_id", momentId)
    .eq("user_id", req.userId)
    .maybeSingle();

  res.json({ counts, userEmoji: (userRow as { emoji: string } | null)?.emoji ?? null });
});

router.post("/moments/:id/react", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { emoji } = req.body as { emoji?: string };
  if (!emoji || !VALID_EMOJIS.includes(emoji)) {
    res.status(400).json({ error: "Invalid emoji" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("moment_reactions")
    .upsert(
      { moment_id: momentId, user_id: req.userId, emoji },
      { onConflict: "moment_id,user_id" },
    );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { data: moment } = await supabaseAdmin
    .from("moments")
    .select("user_id, content")
    .eq("id", momentId)
    .single();

  if (moment && (moment as Record<string, unknown>).user_id !== req.userId) {
    const { data: reactor } = await supabaseAdmin
      .from("users")
      .select("username")
      .eq("id", req.userId)
      .single();

    if (reactor) {
      const u = reactor as { username: string };
      await supabaseAdmin.from("notifications").insert({
        user_id: (moment as Record<string, unknown>).user_id,
        type: "reaction",
        from_user_id: req.userId,
        from_username: u.username,
        from_initials: u.username.substring(0, 2).toUpperCase(),
        from_avatar_color: "#1a3c2a",
        moment_id: momentId,
        moment_preview: ((moment as Record<string, unknown>).content as string).substring(0, 80),
        emoji,
        read: false,
      });
    }
  }

  res.json({ ok: true, emoji });
});

router.delete("/moments/:id/react", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await supabaseAdmin
    .from("moment_reactions")
    .delete()
    .eq("moment_id", momentId)
    .eq("user_id", req.userId);

  res.json({ ok: true });
});

export default router;
