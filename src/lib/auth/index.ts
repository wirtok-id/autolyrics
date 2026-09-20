import { betterAuth } from "better-auth";
import { db } from "../db/client";
import {
  users,
  sessions,
  accounts,
  verificationTokens,
} from "../db/schema";

export const auth = betterAuth({
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL!,
  },
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
    modelName: "users",
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      tier: {
        type: "string",
        required: false,
        defaultValue: "free",
      },
      points: {
        type: "number",
        required: false,
        defaultValue: 10,
      },
      pointsResetAt: {
        type: "date",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verification_tokens",
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
