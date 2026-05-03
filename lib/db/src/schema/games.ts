import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  date: text("date").notNull(),
  alley: text("alley").notNull().default(""),
  oilPattern: text("oil_pattern").notNull().default("House Shot"),
  ballUsed: text("ball_used").notNull().default(""),
  notes: text("notes").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
