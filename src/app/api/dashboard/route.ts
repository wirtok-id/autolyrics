import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users, renders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Tidak ada session aktif" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get renders
    const userRenders = await db.query.renders.findMany({
      where: eq(renders.userId, userId),
      orderBy: (renders, { desc }) => [desc(renders.createdAt)],
      limit: 10,
    });

    // Count total renders
    const totalRenders = await db.query.renders.findMany({
      where: eq(renders.userId, userId),
    });

    const completedRenders = totalRenders.filter(r => r.status === "done").length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        points: user.points,
        pointsResetAt: user.pointsResetAt,
      },
      renders: userRenders.map(r => ({
        id: r.id,
        lyrics: r.lyrics,
        template: r.template,
        status: r.status,
        pointsCost: r.pointsCost,
        videoUrl: r.videoUrl,
        createdAt: r.createdAt,
      })),
      totalRenders: totalRenders.length,
      completedRenders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
