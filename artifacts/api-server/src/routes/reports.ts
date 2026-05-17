import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

const VALID_TYPES = [
  "fake_score",
  "challenge_fraud",
  "spam",
  "inappropriate_content",
  "harassment",
  "other",
] as const;
type ReportType = (typeof VALID_TYPES)[number];

router.post("/reports", async (req, res): Promise<void> => {
  const { reportedUserId, type, reason, momentId } = req.body as {
    reportedUserId: unknown;
    type: unknown;
    reason: unknown;
    momentId: unknown;
  };

  if (!reportedUserId || typeof reportedUserId !== "number") {
    res.status(400).json({ error: "reportedUserId is required" });
    return;
  }
  if (reportedUserId === req.userId) {
    res.status(400).json({ error: "You cannot report yourself" });
    return;
  }
  if (!VALID_TYPES.includes(type as ReportType)) {
    res.status(400).json({ error: "Invalid report type" });
    return;
  }
  if (reason !== undefined && reason !== null && typeof reason !== "string") {
    res.status(400).json({ error: "reason must be a string" });
    return;
  }
  if (momentId !== undefined && momentId !== null && typeof momentId !== "number") {
    res.status(400).json({ error: "momentId must be a number" });
    return;
  }

  const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) || null : null;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("reporter_id", req.userId)
    .eq("reported_user_id", reportedUserId)
    .eq("type", type)
    .gte("created_at", cutoff)
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: "You've already submitted this type of report for this user recently" });
    return;
  }

  const { error } = await supabaseAdmin.from("reports").insert({
    reporter_id:      req.userId,
    reported_user_id: reportedUserId,
    type,
    reason:           cleanReason,
    moment_id:        momentId ?? null,
  });

  if (error) {
    req.log.error({ err: error }, "Failed to insert report");
    res.status(500).json({ error: "Failed to submit report" });
    return;
  }

  res.status(201).json({ success: true });
});

export default router;
