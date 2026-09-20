import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNextMondayReset } from "@/lib/utils";

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Create user with Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    // Update additional fields
    await db
      .update(users)
      .set({
        role: "user",
        tier: "free",
        points: 10,
        pointsResetAt: getNextMondayReset(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.user.id));

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
