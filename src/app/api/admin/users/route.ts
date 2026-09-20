import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/admin/users
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Tidak ada session aktif" }, { status: 401 });
    }

    // Check admin role
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, tier, points, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (tier !== undefined) updates.tier = tier;
    if (points !== undefined) updates.points = points;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada yang diupdate" }, { status: 400 });
    }

    // Update user
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User berhasil diupdate" });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
