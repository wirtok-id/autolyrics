import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Login with Better Auth
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      session: {
        token: result.session.token,
        expiresAt: result.session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "Email atau password salah";
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
