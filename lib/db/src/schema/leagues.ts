import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaguesTable = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  members: integer("members").notNull().default(0),
  type: text("type").notNull().default("public"),
  level: text("level").notNull().default("BEGINNER"),
  avgScore: integer("avg_score").notNull().default(150),
  weeklyChallenge: text("weekly_challenge"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueMembershipsTable = pgTable("league_memberships", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeagueSchema = createInsertSchema(leaguesTable).omit({ id: true, createdAt: true });
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leaguesTable.$inferSelect;
export type LeagueMembership = typeof leagueMembershipsTable.$inferSelect;
