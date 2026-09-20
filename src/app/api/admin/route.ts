import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users, renders } from "@/lib/db/schema";
import { eq, desc, gte, sql } from "drizzle-orm";

// GET /api/admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Tidak ada session aktif" }, { status: 401 });
    }

    // Check admin role
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Get all renders with user names
    const allRenders = await db.query.renders.findMany({
      orderBy: (renders, { desc }) => [desc(renders.createdAt)],
      limit: 50,
    });

    // Get user names for renders
    const userIds = [...new Set(allRenders.map(r => r.userId))];
    const renderUsers = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
    });
    const userMap = new Map(renderUsers.map(u => [u.id, u.name]));

    // Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalUsers = allUsers.length;
    const totalRenders = allRenders.length;
    const rendersThisMonth = allRenders.filter(r => r.createdAt >= startOfMonth).length;
    const completedRenders = allRenders.filter(r => r.status === "done").length;

    return NextResponse.json({
      users: allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.tier,
        points: u.points,
        createdAt: u.createdAt,
      })),
      renders: allRenders.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: userMap.get(r.userId) || "Unknown",
        status: r.status,
        template: r.template,
        audioDuration: r.audioDuration,
        pointsCost: r.pointsCost,
        createdAt: r.createdAt,
      })),
      stats: {
        totalUsers,
        totalRenders,
        rendersThisMonth,
        completedRenders,
      },
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
