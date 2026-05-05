import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { timeAgo } from "../lib/timeAgo";

const router: IRouter = Router();

router.post("/moments/:id/save", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const listId = req.body.listId ? parseInt(req.body.listId) : null;

  const { data: moment, error: momentErr } = await supabaseAdmin
    .from("moments")
    .select("id, save_count")
    .eq("id", momentId)
    .single();

  if (momentErr || !moment) {
    res.status(404).json({ error: "Moment not found" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("moment_saves")
    .select("id")
    .eq("user_id", req.userId)
    .eq("moment_id", momentId)
    .maybeSingle();

  if (existing) {
    res.json({ saved: true, alreadySaved: true });
    return;
  }

  await supabaseAdmin.from("moment_saves").insert({
    user_id: req.userId,
    moment_id: momentId,
    list_id: listId,
  });

  await supabaseAdmin
    .from("moments")
    .update({ save_count: (moment.save_count ?? 0) + 1 })
    .eq("id", momentId);

  res.status(201).json({ saved: true });
});

router.delete("/moments/:id/save", async (req, res): Promise<void> => {
  const momentId = parseInt(req.params.id);
  if (isNaN(momentId)) {
    res.status(400).json({ error: "Invalid moment id" });
    return;
  }

  const { data: deleted } = await supabaseAdmin
    .from("moment_saves")
    .delete()
    .eq("user_id", req.userId)
    .eq("moment_id", momentId)
    .select();

  if (deleted && deleted.length > 0) {
    const { data: moment } = await supabaseAdmin
      .from("moments")
      .select("save_count")
      .eq("id", momentId)
      .single();
    if (moment) {
      await supabaseAdmin
        .from("moments")
        .update({ save_count: Math.max(0, (moment.save_count ?? 1) - 1) })
        .eq("id", momentId);
    }
  }

  res.json({ saved: false });
});

router.get("/saves", async (req, res): Promise<void> => {
  const listId = req.query.listId ? parseInt(req.query.listId as string) : null;

  let query = supabaseAdmin
    .from("moment_saves")
    .select("moment_id, list_id, created_at")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (listId) {
    query = query.eq("list_id", listId);
  }

  const { data: saves, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!saves || saves.length === 0) {
    res.json([]);
    return;
  }

  const momentIds = saves.map((s: Record<string, unknown>) => s.moment_id);
  const { data: moments } = await supabaseAdmin
    .from("moments")
    .select("*")
    .in("id", momentIds);

  const momentMap = new Map(
    (moments ?? []).map((m: Record<string, unknown>) => [m.id, m])
  );

  const result = saves.map((s: Record<string, unknown>) => {
    const m = (momentMap.get(s.moment_id) ?? {}) as Record<string, unknown>;
    return {
      saveId: s.id,
      listId: s.list_id,
      savedAt: s.created_at,
      moment: {
        id: m.id,
        username: m.username,
        rank: m.rank,
        rankColor: m.rank_color,
        content: m.content,
        score: m.score ?? null,
        type: m.type,
        likes: m.likes,
        comments: m.comment_count ?? m.comments,
        initials: m.initials,
        avatarColor: m.avatar_color,
        timeAgo: m.created_at ? timeAgo(new Date(m.created_at as string)) : "",
        createdAt: m.created_at,
      },
    };
  });

  res.json(result);
});

router.get("/saves/lists", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("save_lists")
    .select("id, name, created_at")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const lists = await Promise.all(
    (data ?? []).map(async (l: Record<string, unknown>) => {
      const { count } = await supabaseAdmin
        .from("moment_saves")
        .select("id", { count: "exact", head: true })
        .eq("list_id", l.id);
      return { id: l.id, name: l.name, count: count ?? 0, createdAt: l.created_at };
    })
  );

  res.json(lists);
});

router.post("/saves/lists", async (req, res): Promise<void> => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("save_lists")
    .insert({ user_id: req.userId, name: name.trim() })
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: error?.message ?? "Insert failed" });
    return;
  }

  res.status(201).json({ id: data.id, name: data.name, count: 0, createdAt: data.created_at });
});

export default router;
