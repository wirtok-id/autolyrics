import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "../db/client";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // server-owned field
      },
      tier: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false, // server-owned field
      },
      points: {
        type: "number",
        required: false,
        defaultValue: 10,
        input: false, // server-owned field
      },
      pointsResetAt: {
        type: "date",
        required: false,
        input: false, // server-owned field
      },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type Session = typeof auth.$Infer.Session;
