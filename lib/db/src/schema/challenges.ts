import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  rank: text("rank").notNull(),
  rankColor: text("rank_color").notNull(),
  postedScore: integer("posted_score").notNull(),
  stake: integer("stake").notNull(),
  status: text("status").notNull().default("open"),
  initials: text("initials").notNull(),
  avatarColor: text("avatar_color").notNull(),
  isPro: boolean("is_pro").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
