import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

type BallRow = {
  id: number;
  user_id: number;
  name: string;
  brand: string | null;
  weight: number | null;
  color: string | null;
  coverstock: string | null;
  core: string | null;
  drilling_layout: string | null;
  span: string | null;
  pitch: string | null;
  surface: string | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

function mapBall(row: BallRow) {
  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand,
    weight: row.weight,
    color: row.color,
    coverstock: row.coverstock,
    core: row.core,
    drillingLayout: row.drilling_layout,
    span: row.span,
    pitch: row.pitch,
    surface: row.surface,
    notes: row.notes,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

router.get("/balls", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("bowling_balls")
    .select("*")
    .eq("user_id", req.userId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map((b) => mapBall(b as BallRow)));
});

router.get("/balls/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { data: ball, error } = await supabaseAdmin
    .from("bowling_balls")
    .select("*")
    .eq("id", id)
    .eq("user_id", req.userId)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!ball) {
    res.status(404).json({ error: "Ball not found" });
    return;
  }

  const { data: games } = await supabaseAdmin
    .from("games")
    .select("id, score, date, alley, oil_pattern, created_at")
    .eq("user_id", req.userId)
    .eq("ball_id", id)
    .order("created_at", { ascending: false });

  const scores = (games ?? []).map((g: { score: number }) => g.score);
  const total = scores.length;
  const avg = total ? Math.round(scores.reduce((s, n) => s + n, 0) / total) : 0;
  const high = total ? Math.max(...scores) : 0;

  res.json({
    ball: mapBall(ball as BallRow),
    stats: { totalGames: total, avgScore: avg, highGame: high },
    recentGames: (games ?? []).slice(0, 10).map((g) => ({
      id: String((g as { id: number }).id),
      score: (g as { score: number }).score,
      date: (g as { date: string }).date,
      alley: (g as { alley: string }).alley,
      oilPattern: (g as { oil_pattern: string }).oil_pattern,
    })),
  });
});

router.post("/balls", async (req, res): Promise<void> => {
  const b = (req.body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const insert = {
    user_id: req.userId,
    name,
    brand: (b.brand as string) ?? null,
    weight: typeof b.weight === "number" ? b.weight : null,
    color: (b.color as string) ?? null,
    coverstock: (b.coverstock as string) ?? null,
    core: (b.core as string) ?? null,
    drilling_layout: (b.drillingLayout as string) ?? null,
    span: (b.span as string) ?? null,
    pitch: (b.pitch as string) ?? null,
    surface: (b.surface as string) ?? null,
    notes: (b.notes as string) ?? null,
    image_url: (b.imageUrl as string) ?? null,
    is_active: typeof b.isActive === "boolean" ? b.isActive : true,
  };

  const { data, error } = await supabaseAdmin
    .from("bowling_balls")
    .insert(insert)
    .select()
    .single();
  if (error || !data) {
    res.status(500).json({ error: error?.message ?? "Insert failed" });
    return;
  }
  res.status(201).json(mapBall(data as BallRow));
});

router.patch("/balls/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const b = (req.body ?? {}) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const map: Record<string, string> = {
    name: "name",
    brand: "brand",
    weight: "weight",
    color: "color",
    coverstock: "coverstock",
    core: "core",
    drillingLayout: "drilling_layout",
    span: "span",
    pitch: "pitch",
    surface: "surface",
    notes: "notes",
    imageUrl: "image_url",
    isActive: "is_active",
  };
  for (const [k, v] of Object.entries(b)) {
    if (k in map) update[map[k]] = v;
  }

  const { data, error } = await supabaseAdmin
    .from("bowling_balls")
    .update(update)
    .eq("id", id)
    .eq("user_id", req.userId)
    .select()
    .single();
  if (error || !data) {
    res.status(404).json({ error: error?.message ?? "Ball not found" });
    return;
  }
  res.json(mapBall(data as BallRow));
});

router.delete("/balls/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { error } = await supabaseAdmin
    .from("bowling_balls")
    .delete()
    .eq("id", id)
    .eq("user_id", req.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
