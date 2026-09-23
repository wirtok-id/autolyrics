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

    const render = await db.query.renders.findFirst({
      where: eq(renders.id, id),
    });

    if (!render) {
      return NextResponse.json(
        { error: "Render tidak ditemukan" },
        { status: 404 }
      );
    }

    if (render.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: render.id,
      lyrics: render.lyrics,
      lyricsSynced: render.lyricsSynced,
      template: render.template,
      status: render.status,
      pointsCost: render.pointsCost,
      audioUrl: render.audioUrl,
      audioKey: render.audioKey,
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

// PATCH /api/render/status/[id] — update status (for error reporting)
export async function PATCH(
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

    const render = await db.query.renders.findFirst({
      where: eq(renders.id, id),
    });

    if (!render) {
      return NextResponse.json(
        { error: "Render tidak ditemukan" },
        { status: 404 }
      );
    }

    if (render.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, errorMessage } = body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (errorMessage) updates.errorMessage = errorMessage;

    await db
      .update(renders)
      .set(updates)
      .where(eq(renders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Render patch error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
