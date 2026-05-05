import { type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.path === "/healthz") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const authId = data.user.id;

  try {
    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .maybeSingle();

    if (userErr) throw userErr;

    if (user) {
      req.authId = authId;
      req.userId = user.id as number;
      next();
      return;
    }

    const email = data.user.email ?? "";
    const metaUsername = data.user.user_metadata?.username as string | undefined;
    const username = (metaUsername ?? email.split("@")[0])
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 16);
    const name = (data.user.user_metadata?.full_name as string | undefined) ?? username;

    const { data: newUser, error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: authId,
        username,
        name,
        rank: "Rookie",
        level: 1,
        xp: 0,
        xp_to_next: 1000,
        is_pro: false,
        career_avg: 0,
        high_game: 0,
        total_games: 0,
        team: "Solo",
        rating: 1000,
      })
      .select("id")
      .single();

    if (insertErr || !newUser) {
      logger.error({ insertErr }, "Failed to create user");
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    logger.info({ authId, username }, "Created new user from Supabase auth");
    req.authId = authId;
    req.userId = newUser.id as number;
    next();
  } catch (err) {
    logger.error({ err }, "Error in supabaseAuthMiddleware");
    res.status(500).json({ error: "Internal server error" });
  }
}
