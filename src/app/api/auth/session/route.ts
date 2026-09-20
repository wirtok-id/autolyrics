import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/auth/session
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

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      session: {
        token: session.session.token,
        expiresAt: session.session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
