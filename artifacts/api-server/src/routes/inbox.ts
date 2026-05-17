import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

router.get("/inbox", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const unreadCount = rows.filter((n) => !n.read).length;

  const notifications = rows.map((n) => ({
    id: n.id,
    type: n.type,
    fromUserId: n.from_user_id,
    fromUsername: n.from_username,
    fromInitials: n.from_initials,
    fromAvatarColor: n.from_avatar_color,
    momentId: n.moment_id,
    momentPreview: n.moment_preview,
    emoji: n.emoji,
    message: n.message,
    read: n.read,
    timeAgo: timeAgo(new Date(n.created_at as string)),
    createdAt: n.created_at,
  }));

  res.json({ notifications, unreadCount });
});

router.patch("/inbox/read", async (req, res): Promise<void> => {
  await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", req.userId)
    .eq("read", false);

  res.json({ ok: true });
});

export default router;
