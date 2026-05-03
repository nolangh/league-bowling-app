import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const DEMO_USER_ID = 1;

export async function demoUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  req.userId = DEMO_USER_ID;

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, DEMO_USER_ID));

    if (!existing) {
      await db.insert(usersTable).values({
        id: DEMO_USER_ID,
        username: "STRIKER_AC",
        name: "Alex Chen",
        rank: "Legend",
        level: 42,
        xp: 12450,
        xpToNext: 15000,
        isPro: false,
        careerAvg: 218,
        highGame: 300,
        totalGames: 847,
        team: "Strike Force",
        rating: 1842,
      });
      logger.info("Created demo user");
    }
  } catch (err) {
    logger.error({ err }, "Failed to ensure demo user");
  }

  next();
}
