import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const momentsTable = pgTable("moments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  rank: text("rank").notNull(),
  rankColor: text("rank_color").notNull(),
  content: text("content").notNull(),
  score: integer("score"),
  type: text("type").notNull().default("general"),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  initials: text("initials").notNull(),
  avatarColor: text("avatar_color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const momentLikesTable = pgTable("moment_likes", {
  id: serial("id").primaryKey(),
  momentId: integer("moment_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMomentSchema = createInsertSchema(momentsTable).omit({ id: true, createdAt: true, likes: true });
export type InsertMoment = z.infer<typeof insertMomentSchema>;
export type Moment = typeof momentsTable.$inferSelect;
export type MomentLike = typeof momentLikesTable.$inferSelect;
