import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId, getNextMondayReset, COOLDOWN_MS } from "@/lib/utils";

// POST /api/render/create
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { audioKey, audioDuration, lyrics, template, autoSync } = body;

    // Validation
    if (!lyrics || !template) {
      return NextResponse.json(
        { error: "Lirik dan template wajib diisi" },
        { status: 400 }
      );
    }

    if (!audioDuration || audioDuration > 300) {
      return NextResponse.json(
        { error: "Durasi audio maksimal 5 menit" },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check points (admin unlimited)
    if (user.role !== "admin" && user.points <= 0) {
      return NextResponse.json(
        { error: "Poin habis. Menunggu reset mingguan." },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: `Cooldown. Tunggu ${remainingMinutes} menit lagi.` },
          { status: 429 }
        );
      }
    }

    // Calculate points cost
    const pointsCost = audioDuration <= 180 ? 1 : 2;

    // Deduct points (admin doesn't lose points)
    if (user.role !== "admin") {
      const newPoints = user.points - pointsCost;
      const needsReset = !user.pointsResetAt || new Date() >= user.pointsResetAt;
      
      await db
        .update(users)
        .set({
          points: needsReset ? 10 - pointsCost : newPoints,
          pointsResetAt: needsReset ? getNextMondayReset() : user.pointsResetAt,
        })
        .where(eq(users.id, userId));
    }

    // Create render record
    const renderId = createId();
    
    // Auto-sync lyrics if enabled
    let syncedLyricsJson = null;
    if (autoSync && audioKey) {
      try {
        // Note: In production, we'd pass the actual audio file
        // For now, we'll skip the actual whisper call and use linear sync
        syncedLyricsJson = JSON.stringify(
          lyrics.split("\n")
            .filter((l: string) => l.trim())
            .map((line: string, i: number, arr: string[]) => ({
              text: line,
              start: (i / arr.length) * audioDuration,
              end: ((i + 1) / arr.length) * audioDuration,
              confidence: 0.5,
            }))
        );
      } catch (error) {
        console.error("Auto-sync failed, using linear:", error);
      }
    }

    await db.insert(renders).values({
      id: renderId,
      userId,
      audioUrl: null,
      audioKey: audioKey || null,
      audioDuration: audioDuration || null,
      lyrics,
      lyricsSynced: syncedLyricsJson,
      template: template || "gradient-dark",
      videoUrl: null,
      videoKey: null,
      status: "pending",
      pointsCost,
      createdAt: new Date(),
    });

    // TODO: Trigger actual render (Modal/Render.com)
    // For now, use mock render
    const { renderVideo } = await import("@/lib/render");
    
    setTimeout(async () => {
      try {
        // Update status to processing
        await db
          .update(renders)
          .set({ status: "processing" })
          .where(eq(renders.id, renderId));

        // Parse synced lyrics
        const parsedLyrics = syncedLyricsJson 
          ? JSON.parse(syncedLyricsJson)
          : lyrics.split("\n")
              .filter((l: string) => l.trim())
              .map((line: string, i: number, arr: string[]) => ({
                text: line,
                start: (i / arr.length) * audioDuration,
                end: ((i + 1) / arr.length) * audioDuration,
                confidence: 0.5,
              }));

        // Call render function
        const result = await renderVideo({
          id: renderId,
          audioUrl: `https://placeholder.com/audio/${audioKey}`,
          lyrics: parsedLyrics,
          template: template || "gradient-dark",
          userId,
          duration: audioDuration,
        });

        // Update status to done
        await db
          .update(renders)
          .set({
            status: "done",
            videoUrl: result.videoUrl,
            completedAt: new Date(),
          })
          .where(eq(renders.id, renderId));
      } catch (error) {
        console.error("Render failed:", error);
        await db
          .update(renders)
          .set({ status: "failed", errorMessage: "Render gagal" })
          .where(eq(renders.id, renderId));
      }
    }, 100);

    return NextResponse.json({
      success: true,
      renderId,
      pointsCost,
      message: "Render berhasil dimulai",
    });
  } catch (error) {
    console.error("Render create error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
