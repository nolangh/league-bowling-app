import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabase";

export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.authId, authId));

    if (!user) {
      const email = data.user.email ?? "";
      const username = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 16);
      const name = data.user.user_metadata?.full_name ?? username;

      [user] = await db
        .insert(usersTable)
        .values({
          authId,
          username,
          name,
          rank: "Rookie",
          level: 1,
          xp: 0,
          xpToNext: 1000,
          isPro: false,
          careerAvg: 0,
          highGame: 0,
          totalGames: 0,
          team: "Solo",
          rating: 1000,
        })
        .returning();

      logger.info({ authId, username }, "Created new user from Supabase auth");
    }

    req.authId = authId;
    req.userId = user.id;
    next();
  } catch (err) {
    logger.error({ err }, "Error in supabaseAuthMiddleware");
    res.status(500).json({ error: "Internal server error" });
  }
}
