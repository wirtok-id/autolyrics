import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";

// ============================================
// Better Auth Tables
// ============================================

// Users table (compatible with Better Auth)
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  tier: text("tier", { enum: ["free", "friend", "family"] })
    .notNull()
    .default("free"),
  points: integer("points").notNull().default(10),
  pointsResetAt: timestamp("points_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Sessions table (Better Auth)
export const sessions = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Accounts table (Better Auth - for OAuth, skip implementation for now)
export const accounts = pgTable("accounts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Verification Tokens table (Better Auth - for password reset, email verification)
export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================
// AutoLyrics Tables
// ============================================

// Renders table
export const renders = pgTable("renders", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  audioUrl: text("audio_url"),
  audioKey: text("audio_key"),
  audioDuration: integer("audio_duration"),
  lyrics: text("lyrics").notNull(),
  lyricsSynced: text("lyrics_synced"), // JSON string of synced lyrics
  template: text("template").notNull().default("gradient-dark"),
  videoUrl: text("video_url"),
  videoKey: text("video_key"),
  status: text("status", {
    enum: ["pending", "processing", "done", "failed"],
  })
    .notNull()
    .default("pending"),
  pointsCost: integer("points_cost").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// Point logs table (audit trail)
export const pointLogs = pgTable("point_logs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================
// Types
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Render = typeof renders.$inferSelect;
export type NewRender = typeof renders.$inferInsert;
export type PointLog = typeof pointLogs.$inferSelect;
export type NewPointLog = typeof pointLogs.$inferInsert;
