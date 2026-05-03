import { pgTable, serial, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: uuid("auth_id").unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  rank: text("rank").notNull().default("Rookie"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpToNext: integer("xp_to_next").notNull().default(1000),
  isPro: boolean("is_pro").notNull().default(false),
  careerAvg: integer("career_avg").notNull().default(0),
  highGame: integer("high_game").notNull().default(0),
  totalGames: integer("total_games").notNull().default(0),
  team: text("team").notNull().default("Solo"),
  rating: integer("rating").notNull().default(1000),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
