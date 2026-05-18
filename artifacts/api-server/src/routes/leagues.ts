import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { JoinLeagueParams } from "@workspace/api-zod";

const router: IRouter = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function mapLeague(row: Record<string, unknown>, extra?: Record<string, unknown>) {
  return {
    id:              row.id,
    name:            row.name,
    description:     row.description,
    members:         row.members,
    type:            row.type,
    level:           row.level,
    avgScore:        row.avg_score,
    weeklyChallenge: row.weekly_challenge ?? null,
    createdBy:       row.created_by ?? null,
    createdAt:       row.created_at,
    format:          row.format ?? "casual",
    teamSize:        row.team_size ?? null,
    seasonStart:     row.season_start ?? null,
    seasonWeeks:     row.season_weeks ?? null,
    meetDay:         row.meet_day ?? null,
    meetTime:        row.meet_time ?? null,
    scoringType:     row.scoring_type ?? null,
    handicapBase:    row.handicap_base ?? null,
    handicapPercent: row.handicap_percent ?? null,
    pointSystem:     row.point_system ?? null,
    absenteeScore:   row.absentee_score ?? null,
    fees:            row.fees ?? null,
    rules:           row.rules ?? null,
    ...extra,
  };
}

const MEET_DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const POINT_SYSTEMS = ["standard","petersen","head_to_head","total_pins"];

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

async function getMembership(leagueId: number, userId: number) {
  const { data } = await supabaseAdmin
    .from("league_memberships")
    .select("id, role")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as { id: number; role: string } | null;
}

// ─── List / search leagues ────────────────────────────────────────────────────

router.get("/leagues", async (req, res): Promise<void> => {
  const qRaw  = typeof req.query.q    === "string" ? req.query.q.trim().slice(0, 100) : "";
  const type  = typeof req.query.type === "string" ? req.query.type : "";
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 200);

  let query = supabaseAdmin.from("leagues").select("*");
  if (qRaw) {
    const safe    = qRaw.replace(/[%,()]/g, " ");
    const pattern = `%${safe}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern},level.ilike.${pattern}`);
  }
  if (type === "public" || type === "private") query = query.eq("type", type);

  const { data: leagues, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const { data: memberships } = await supabaseAdmin
    .from("league_memberships")
    .select("league_id, role")
    .eq("user_id", req.userId);

  const memberMap = new Map((memberships ?? []).map((m: { league_id: number; role: string }) => [m.league_id, m.role]));

  const formatted = (leagues ?? []).map((l: Record<string, unknown>) => ({
    ...mapLeague(l),
    joined: memberMap.has(l.id as number),
    myRole: memberMap.get(l.id as number) ?? null,
  }));

  res.json(formatted);
});

// ─── Create league ────────────────────────────────────────────────────────────

router.post("/leagues", async (req, res): Promise<void> => {
  const b = req.body as Record<string, unknown>;
  const { name, description, type, level, weeklyChallenge, format } = b;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" }); return;
  }
  if (!description || typeof description !== "string") {
    res.status(400).json({ error: "description is required" }); return;
  }
  const leagueType   = type === "private" ? "private" : "public";
  const leagueLevel  = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(String(level))
    ? String(level) : "BEGINNER";
  const leagueFormat = format === "traditional" ? "traditional" : "casual";

  const isTraditional = leagueFormat === "traditional";
  const meetDay   = typeof b.meetDay === "string" && MEET_DAYS.includes(b.meetDay.toLowerCase())
    ? b.meetDay.toLowerCase() : null;

  // Real HH:MM 24h validation (00:00 .. 23:59)
  let meetTime: string | null = null;
  if (typeof b.meetTime === "string" && /^\d{2}:\d{2}$/.test(b.meetTime)) {
    const [hh, mm] = b.meetTime.split(":").map(Number);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) meetTime = b.meetTime;
  }

  const scoringType = b.scoringType === "handicap" ? "handicap" : (b.scoringType === "scratch" ? "scratch" : null);
  const pointSystem = typeof b.pointSystem === "string" && POINT_SYSTEMS.includes(b.pointSystem)
    ? b.pointSystem : null;

  // Real calendar date validation (YYYY-MM-DD where the date actually exists)
  let seasonStart: string | null = null;
  if (typeof b.seasonStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.seasonStart)) {
    const d = new Date(b.seasonStart + "T00:00:00Z");
    if (!isNaN(d.getTime()) && d.toISOString().slice(0, 10) === b.seasonStart) seasonStart = b.seasonStart;
  }

  const teamSize       = isTraditional ? clampInt(b.teamSize, 2, 5) : null;
  const seasonWeeks    = isTraditional ? clampInt(b.seasonWeeks, 1, 52) : null;
  const absenteeScore  = isTraditional ? (b.absenteeScore == null ? 0 : clampInt(b.absenteeScore, 0, 300)) : null;
  // Apply USBC-style defaults when handicap scoring is selected but values are missing/invalid
  const handicapBase    = isTraditional && scoringType === "handicap"
    ? (clampInt(b.handicapBase, 100, 300) ?? 220) : null;
  const handicapPercent = isTraditional && scoringType === "handicap"
    ? (clampInt(b.handicapPercent, 1, 100) ?? 80) : null;

  // Strict required fields for traditional format
  if (isTraditional) {
    if (teamSize == null)       { res.status(400).json({ error: "teamSize is required for traditional leagues (2–5)." }); return; }
    if (seasonWeeks == null)    { res.status(400).json({ error: "seasonWeeks is required (1–52)." }); return; }
    if (!seasonStart)           { res.status(400).json({ error: "seasonStart must be a valid YYYY-MM-DD date." }); return; }
    if (!meetDay)               { res.status(400).json({ error: "meetDay is required (monday–sunday)." }); return; }
    if (!meetTime)              { res.status(400).json({ error: "meetTime is required (HH:MM, 24-hour)." }); return; }
    if (!scoringType)           { res.status(400).json({ error: "scoringType is required ('scratch' or 'handicap')." }); return; }
    if (!pointSystem)           { res.status(400).json({ error: "pointSystem is required." }); return; }
  }

  const { data: league, error } = await supabaseAdmin
    .from("leagues")
    .insert({
      name:             (name as string).trim().slice(0, 100),
      description:      (description as string).trim().slice(0, 500),
      type:             leagueType,
      level:            leagueLevel,
      members:          1,
      avg_score:        150,
      weekly_challenge: typeof weeklyChallenge === "string" ? weeklyChallenge.trim().slice(0, 200) || null : null,
      created_by:       req.userId,
      format:           leagueFormat,
      team_size:        teamSize,
      season_start:     seasonStart,
      season_weeks:     seasonWeeks,
      meet_day:         meetDay,
      meet_time:        meetTime,
      scoring_type:     scoringType,
      handicap_base:    handicapBase,
      handicap_percent: handicapPercent,
      point_system:     pointSystem,
      absentee_score:   absenteeScore,
      fees:             typeof b.fees === "string" ? b.fees.trim().slice(0, 300) || null : null,
      rules:            typeof b.rules === "string" ? b.rules.trim().slice(0, 2000) || null : null,
    })
    .select()
    .single();

  if (error || !league) { res.status(500).json({ error: error?.message ?? "Insert failed" }); return; }

  // creator becomes admin member
  await supabaseAdmin.from("league_memberships").insert({
    league_id: league.id,
    user_id:   req.userId,
    status:    "member",
    role:      "admin",
  });

  res.status(201).json({ ...mapLeague(league), joined: true, myRole: "admin" });
});

// ─── Get single league ────────────────────────────────────────────────────────

router.get("/leagues/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data: league, error } = await supabaseAdmin
    .from("leagues").select("*").eq("id", id).single();

  if (error || !league) { res.status(404).json({ error: "League not found" }); return; }

  const mem = await getMembership(id, req.userId);
  res.json({ ...mapLeague(league), joined: !!mem, myRole: mem?.role ?? null });
});

// ─── Join league ──────────────────────────────────────────────────────────────

router.post("/leagues/:id/join", async (req, res): Promise<void> => {
  const params = JoinLeagueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { data: league, error: leagueErr } = await supabaseAdmin
    .from("leagues").select("*").eq("id", params.data.id).single();
  if (leagueErr || !league) { res.status(404).json({ error: "League not found" }); return; }

  const existing = await getMembership(params.data.id, req.userId);
  if (!existing) {
    await supabaseAdmin.from("league_memberships").insert({
      league_id: params.data.id, user_id: req.userId, status: "member", role: "member",
    });
    const { data: updated } = await supabaseAdmin
      .from("leagues")
      .update({ members: (league.members as number) + 1 })
      .eq("id", params.data.id).select().single();
    res.json({ ...mapLeague(updated ?? league), joined: true, myRole: "member" });
    return;
  }
  res.json({ ...mapLeague(league), joined: true, myRole: existing.role });
});

// ─── Leave league ─────────────────────────────────────────────────────────────

router.delete("/leagues/:id/leave", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await getMembership(id, req.userId);
  if (!existing) { res.status(404).json({ error: "Not a member" }); return; }

  // prevent last admin from leaving without transferring
  if (existing.role === "admin") {
    const { count } = await supabaseAdmin
      .from("league_memberships")
      .select("id", { count: "exact", head: true })
      .eq("league_id", id).eq("role", "admin");
    if ((count ?? 0) <= 1) {
      res.status(400).json({ error: "Transfer admin role before leaving" }); return;
    }
  }

  await supabaseAdmin.from("league_memberships")
    .delete().eq("league_id", id).eq("user_id", req.userId);

  const { data: league } = await supabaseAdmin.from("leagues").select("members").eq("id", id).single();
  if (league) {
    await supabaseAdmin.from("leagues")
      .update({ members: Math.max(0, (league.members as number) - 1) }).eq("id", id);
  }

  res.json({ left: true });
});

// ─── Members ──────────────────────────────────────────────────────────────────

router.get("/leagues/:id/members", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabaseAdmin
    .from("league_memberships")
    .select("user_id, role, status, created_at")
    .eq("league_id", id)
    .order("created_at", { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }

  const userIds = (data ?? []).map((m: Record<string, unknown>) => m.user_id as number);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, username, name, rank, career_avg, high_game")
    .in("id", userIds.length ? userIds : [-1]);

  const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id, u]));

  const members = (data ?? []).map((m: Record<string, unknown>) => {
    const u = userMap.get(m.user_id as number) as Record<string, unknown> | undefined;
    return {
      userId:    m.user_id,
      role:      m.role,
      status:    m.status,
      joinedAt:  m.created_at,
      username:  u?.username ?? "Unknown",
      name:      u?.name ?? "",
      rank:      u?.rank ?? "Rookie",
      careerAvg: u?.career_avg ?? 0,
      highGame:  u?.high_game ?? 0,
    };
  });

  res.json(members);
});

// ─── Update member role (admin only) ─────────────────────────────────────────

router.patch("/leagues/:id/members/:userId/role", async (req, res): Promise<void> => {
  const id     = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  if (isNaN(id) || isNaN(userId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const myMem = await getMembership(id, req.userId);
  if (myMem?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { role } = req.body as { role: string };
  if (role !== "admin" && role !== "member") { res.status(400).json({ error: "role must be admin or member" }); return; }

  await supabaseAdmin.from("league_memberships")
    .update({ role }).eq("league_id", id).eq("user_id", userId);

  res.json({ updated: true });
});

// ─── Kick member (admin only) ─────────────────────────────────────────────────

router.delete("/leagues/:id/members/:userId", async (req, res): Promise<void> => {
  const id     = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  if (isNaN(id) || isNaN(userId)) { res.status(400).json({ error: "Invalid id" }); return; }

  if (userId === req.userId) { res.status(400).json({ error: "Cannot kick yourself; use leave instead" }); return; }

  const myMem = await getMembership(id, req.userId);
  if (myMem?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  await supabaseAdmin.from("league_memberships")
    .delete().eq("league_id", id).eq("user_id", userId);

  const { data: league } = await supabaseAdmin.from("leagues").select("members").eq("id", id).single();
  if (league) {
    await supabaseAdmin.from("leagues")
      .update({ members: Math.max(0, (league.members as number) - 1) }).eq("id", id);
  }

  res.json({ kicked: true });
});

// ─── Announcements ────────────────────────────────────────────────────────────

router.get("/leagues/:id/announcements", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabaseAdmin
    .from("league_announcements")
    .select("*")
    .eq("league_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const authorIds = [...new Set((data ?? []).map((a: Record<string, unknown>) => a.author_id as number))];
  const { data: users } = await supabaseAdmin
    .from("users").select("id, username, rank").in("id", authorIds.length ? authorIds : [-1]);
  const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id, u]));

  const announcements = (data ?? []).map((a: Record<string, unknown>) => {
    const u = userMap.get(a.author_id as number) as Record<string, unknown> | undefined;
    return {
      id:        a.id,
      leagueId:  a.league_id,
      authorId:  a.author_id,
      username:  u?.username ?? "Admin",
      rank:      u?.rank ?? "",
      content:   a.content,
      createdAt: a.created_at,
    };
  });

  res.json(announcements);
});

router.post("/leagues/:id/announcements", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const myMem = await getMembership(id, req.userId);
  if (myMem?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { content } = req.body as { content: string };
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "content is required" }); return;
  }

  const { data, error } = await supabaseAdmin
    .from("league_announcements")
    .insert({ league_id: id, author_id: req.userId, content: content.trim().slice(0, 2000) })
    .select().single();

  if (error || !data) { res.status(500).json({ error: error?.message ?? "Failed" }); return; }

  const { data: author } = await supabaseAdmin.from("users").select("username, rank").eq("id", req.userId).single();

  res.status(201).json({
    id:        data.id,
    leagueId:  data.league_id,
    authorId:  data.author_id,
    username:  (author as Record<string, unknown>)?.username ?? "Admin",
    rank:      (author as Record<string, unknown>)?.rank ?? "",
    content:   data.content,
    createdAt: data.created_at,
  });
});

export default router;
