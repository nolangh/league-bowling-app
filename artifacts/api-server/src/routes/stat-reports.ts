import { Router, type IRouter } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { sendReportEmail, type ReportSchedule } from "../lib/reportEmail";

const router: IRouter = Router();

const UpdateScheduleBody = z.object({
  schedule: z.enum(["weekly", "monthly"]).nullable(),
  email: z.string().email().max(320).nullable().optional(),
});

router.get("/stat-reports/schedule", async (req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("report_schedule, report_email, is_pro")
    .eq("id", req.userId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    schedule: data.report_schedule ?? null,
    email: data.report_email ?? null,
    isPro: data.is_pro,
  });
});

router.patch("/stat-reports/schedule", async (req, res): Promise<void> => {
  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { schedule, email } = parsed.data;

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("is_pro")
    .eq("id", req.userId)
    .single();

  if (userErr || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.is_pro && schedule !== null) {
    res.status(403).json({ error: "Scheduled reports are a Pro feature" });
    return;
  }

  const update: Record<string, unknown> = { report_schedule: schedule ?? null };
  if (email !== undefined) {
    update.report_email = email;
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", req.userId)
    .select("report_schedule, report_email, is_pro")
    .single();

  if (updateErr || !updated) {
    req.log.error({ err: updateErr }, "Failed to update report schedule");
    res.status(500).json({ error: "Failed to update schedule" });
    return;
  }

  res.json({
    schedule: updated.report_schedule ?? null,
    email: updated.report_email ?? null,
    isPro: updated.is_pro,
  });
});

router.post("/stat-reports/send", async (req, res): Promise<void> => {
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id, username, name, career_avg, high_game, total_games, wins, losses, bsr, rank, is_pro, report_schedule, report_email, auth_id")
    .eq("id", req.userId)
    .single();

  if (userErr || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.is_pro) {
    res.status(403).json({ error: "Scheduled reports are a Pro feature" });
    return;
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.auth_id as string);
  const authEmail = authUser?.user?.email ?? null;

  const toEmail = (user.report_email as string | null) ?? authEmail;
  if (!toEmail) {
    res.status(400).json({ error: "No email address on file — set one in your schedule settings" });
    return;
  }

  const { data: games } = await supabaseAdmin
    .from("games")
    .select("date, score, alley, oil_pattern, ball_used, verified")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const schedule = (user.report_schedule as ReportSchedule | null) ?? "weekly";

  await sendReportEmail(toEmail, {
    username: user.username as string,
    name: user.name as string,
    careerAvg: (user.career_avg as number) ?? 0,
    highGame: (user.high_game as number) ?? 0,
    totalGames: (user.total_games as number) ?? 0,
    wins: (user.wins as number) ?? 0,
    losses: (user.losses as number) ?? 0,
    bsr: (user.bsr as number) ?? 1200,
    rank: user.rank as string,
    recentGames: (games ?? []).map((g) => ({
      date: g.date as string,
      score: g.score as number,
      alley: g.alley as string,
      oilPattern: g.oil_pattern as string,
      ballUsed: g.ball_used as string,
      verified: g.verified as boolean,
    })),
    schedule,
  });

  await supabaseAdmin
    .from("users")
    .update({ last_report_sent_at: new Date().toISOString() })
    .eq("id", req.userId);

  res.json({ success: true, sentTo: toEmail });
});

/**
 * POST /stat-reports/dispatch
 *
 * Cron endpoint — call this once per day from a scheduled task (e.g. Replit
 * Scheduled Deployments or any external cron service).
 *
 * It queries all Pro users whose report is due (weekly: last sent > 7 days ago
 * or never; monthly: > 28 days ago or never), sends each report, and records
 * `last_report_sent_at`.
 *
 * Secured with a shared secret: callers must supply
 *   Authorization: Bearer <CRON_SECRET>
 * where CRON_SECRET is an environment variable.
 */
router.post("/stat-reports/dispatch", async (req, res): Promise<void> => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!cronSecret || provided !== cronSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = new Date();

  const { data: candidates, error: fetchErr } = await supabaseAdmin
    .from("users")
    .select("id, username, name, career_avg, high_game, total_games, wins, losses, bsr, rank, report_schedule, report_email, last_report_sent_at, auth_id")
    .eq("is_pro", true)
    .not("report_schedule", "is", null);

  if (fetchErr || !candidates) {
    req.log.error({ err: fetchErr }, "Failed to fetch dispatch candidates");
    res.status(500).json({ error: "Failed to query users" });
    return;
  }

  const weeklyMs = 7 * 24 * 60 * 60 * 1000;
  const monthlyMs = 28 * 24 * 60 * 60 * 1000;

  const due = candidates.filter((u) => {
    const lastSentRaw = u.last_report_sent_at as string | null;
    if (!lastSentRaw) return true;
    const lastSentMs = new Date(lastSentRaw).getTime();
    if (isNaN(lastSentMs)) return true;
    const elapsed = now.getTime() - lastSentMs;
    if (u.report_schedule === "weekly") return elapsed >= weeklyMs;
    if (u.report_schedule === "monthly") return elapsed >= monthlyMs;
    return false;
  });

  let sent = 0;
  let failed = 0;

  for (const u of due) {
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(u.auth_id as string);
      const authEmail = authUser?.user?.email ?? null;
      const toEmail = (u.report_email as string | null) ?? authEmail;
      if (!toEmail) continue;

      const { data: games } = await supabaseAdmin
        .from("games")
        .select("date, score, alley, oil_pattern, ball_used, verified")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const schedule = u.report_schedule as ReportSchedule;

      await sendReportEmail(toEmail, {
        username: u.username as string,
        name: u.name as string,
        careerAvg: (u.career_avg as number) ?? 0,
        highGame: (u.high_game as number) ?? 0,
        totalGames: (u.total_games as number) ?? 0,
        wins: (u.wins as number) ?? 0,
        losses: (u.losses as number) ?? 0,
        bsr: (u.bsr as number) ?? 1200,
        rank: u.rank as string,
        recentGames: (games ?? []).map((g) => ({
          date: g.date as string,
          score: g.score as number,
          alley: g.alley as string,
          oilPattern: g.oil_pattern as string,
          ballUsed: g.ball_used as string,
          verified: g.verified as boolean,
        })),
        schedule,
      });

      await supabaseAdmin
        .from("users")
        .update({ last_report_sent_at: new Date().toISOString() })
        .eq("id", u.id);

      sent++;
    } catch (err) {
      req.log.error({ err, userId: u.id }, "Failed to dispatch report for user");
      failed++;
    }
  }

  req.log.info({ sent, failed, candidates: due.length }, "Stat report dispatch complete");
  res.json({ success: true, sent, failed, candidates: due.length });
});

export default router;
