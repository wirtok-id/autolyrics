import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/render/status/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Render ID wajib diisi" },
        { status: 400 }
      );
    }

    // Get render from database
    const render = await db.query.renders.findFirst({
      where: eq(renders.id, id),
    });

    if (!render) {
      return NextResponse.json(
        { error: "Render tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user owns this render (or is admin)
    if (render.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: render.id,
      lyrics: render.lyrics,
      template: render.template,
      status: render.status,
      pointsCost: render.pointsCost,
      videoUrl: render.videoUrl,
      audioDuration: render.audioDuration,
      errorMessage: render.errorMessage,
      createdAt: render.createdAt,
      completedAt: render.completedAt,
    });
  } catch (error) {
    console.error("Render status error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
