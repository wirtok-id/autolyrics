import { db } from "../db/client";
import { users, renders, pointLogs } from "../db/schema";
import { eq, and, gte } from "drizzle-orm";
import {
  getMaxPoints,
  calculatePointsCost,
  getNextMondayReset,
  COOLDOWN_MS,
} from "../utils";

// Get user with fresh points (check if reset needed)
export async function getUserWithFreshPoints(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const now = new Date();
  const resetTime = user.pointsResetAt;

  // Check if points need to be reset (new week)
  if (now >= resetTime) {
    const maxPoints = getMaxPoints(user.tier as "free" | "friend" | "family");
    await db
      .update(users)
      .set({
        points: maxPoints,
        pointsResetAt: getNextMondayReset(),
      })
      .where(eq(users.id, userId));

    return { ...user, points: maxPoints, pointsResetAt: getNextMondayReset() };
  }

  return user;
}

// Check if user can render (has points + not on cooldown)
export async function canUserRender(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getUserWithFreshPoints(userId);
  if (!user) return { allowed: false, reason: "User tidak ditemukan" };

  // Admin can always render
  if (user.role === "admin") return { allowed: true };

  // Check points
  if (user.points <= 0) {
    return { allowed: false, reason: "Poin habis. Menunggu reset mingguan." };
  }

  // Check cooldown
  const lastRender = await db.query.renders.findFirst({
    where: eq(renders.userId, userId),
    orderBy: (renders, { desc }) => [desc(renders.createdAt)],
  });

  if (lastRender) {
    const lastRenderTime = lastRender.createdAt.getTime();
    const now = Date.now();
    if (now - lastRenderTime < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - (now - lastRenderTime);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return {
        allowed: false,
        reason: `Cooldown. Tunggu ${remainingMinutes} menit lagi.`,
      };
    }
  }

  return { allowed: true };
}

// Deduct points for render
export async function deductPoints(userId: string, points: number, renderId: string) {
  const user = await getUserWithFreshPoints(userId);
  if (!user) throw new Error("User tidak ditemukan");

  // Admin doesn't lose points
  if (user.role === "admin") {
    await db.insert(pointLogs).values({
      userId,
      delta: 0,
      reason: `Render ${renderId} (admin unlimited)`,
      createdAt: new Date(),
    });
    return;
  }

  // Deduct points
  await db
    .update(users)
    .set({ points: user.points - points })
    .where(eq(users.id, userId));

  // Log the deduction
  await db.insert(pointLogs).values({
    userId,
    delta: -points,
    reason: `Render ${renderId}`,
    createdAt: new Date(),
  });
}

// Get user render history
export async function getUserRenders(userId: string) {
  return db.query.renders.findMany({
    where: eq(renders.userId, userId),
    orderBy: (renders, { desc }) => [desc(renders.createdAt)],
  });
}

// Get render by ID
export async function getRenderById(renderId: string) {
  return db.query.renders.findFirst({
    where: eq(renders.id, renderId),
  });
}
