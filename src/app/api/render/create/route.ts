import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId, getNextMondayReset, COOLDOWN_MS } from "@/lib/utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { sequentialAlign } from "@/lib/align";

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

    console.log("[RenderCreate] Request:", { audioKey, audioDuration, template, autoSync });

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

    // Create render record first (needed for whisper sync)
    const renderId = createId();

    await db.insert(renders).values({
      id: renderId,
      userId,
      audioUrl: audioKey || null,
      audioKey: audioKey || null,
      audioDuration: audioDuration || null,
      lyrics,
      lyricsSynced: null,
      template: template || "gradient-dark",
      videoUrl: null,
      videoKey: null,
      status: "pending",
      pointsCost,
      createdAt: new Date(),
    });

    console.log("[RenderCreate] Created render record:", renderId);

    // Auto-sync lyrics via Whisper (server-side)
    if (autoSync && audioKey) {
      console.log("[RenderCreate] Starting Whisper sync...");
      try {
        const syncedResult = await callWhisperSync(audioKey, lyrics, renderId, audioDuration);

        if (syncedResult && syncedResult.synced) {
          console.log("[RenderCreate] Whisper sync successful:", syncedResult.segmentCount, "segments");
          // lyricsSynced already saved to DB by callWhisperSync
        } else {
          console.error("[RenderCreate] Whisper sync failed:", syncedResult);
          // Delete the render and refund points — don't let user proceed with bad sync
          await db.delete(renders).where(eq(renders.id, renderId));

          // Refund points
          if (user.role !== "admin") {
            const currentPoints = user.points;
            const refundPoints = currentPoints + pointsCost;
            await db
              .update(users)
              .set({ points: refundPoints })
              .where(eq(users.id, userId));
          }

          return NextResponse.json(
            {
              error: "Gagal sinkronisasi lirik dengan audio. Pastikan audio sesuai dengan lirik yang dimasukkan.",
              whisperError: syncedResult?.error || syncedResult?.reason || "unknown",
            },
            { status: 422 }
          );
        }
      } catch (err) {
        console.error("[RenderCreate] Whisper sync exception:", err);

        // Delete render and refund
        await db.delete(renders).where(eq(renders.id, renderId));
        if (user.role !== "admin") {
          await db
            .update(users)
            .set({ points: user.points + pointsCost })
            .where(eq(users.id, userId));
        }

        return NextResponse.json(
          { error: "Gagal sinkronisasi lirik. Coba lagi." },
          { status: 500 }
        );
      }
    } else if (!autoSync) {
      // No auto-sync: generate linear timing as fallback
      console.log("[RenderCreate] No auto-sync, generating linear timing");
      const lines = lyrics.split("\n").filter((l: string) => l.trim());
      const syncedLyrics = lines.map((line: string, i: number, arr: string[]) => ({
        text: line,
        start: (i / arr.length) * audioDuration,
        end: ((i + 1) / arr.length) * audioDuration,
        confidence: 1.0, // linear is "exact" since user chose manual
      }));

      await db
        .update(renders)
        .set({ lyricsSynced: JSON.stringify(syncedLyrics) })
        .where(eq(renders.id, renderId));
    }

    return NextResponse.json({
      success: true,
      renderId,
      pointsCost,
      message: "Render berhasil dibuat. Klik Mulai Render untuk memulai.",
    });
  } catch (error) {
    console.error("[RenderCreate] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Server-side Whisper sync function
async function callWhisperSync(
  audioKey: string,
  lyrics: string,
  renderId: string,
  audioDuration: number
): Promise<{ synced: boolean; segmentCount?: number; error?: string; reason?: string }> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return { synced: false, reason: "no_api_key", error: "GROQ_API_KEY tidak dikonfigurasi" };
  }

  // Read audio file from disk
  const fullPath = join(process.cwd(), "public", audioKey);
  let audioBuffer: Buffer;
  try {
    audioBuffer = await readFile(fullPath);
  } catch (err) {
    return { synced: false, reason: "audio_not_found", error: `File tidak ditemukan: ${fullPath}` };
  }

  // Determine MIME type
  const ext = audioKey.split(".").pop()?.toLowerCase() || "mp3";
  const mimeMap: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/x-m4a",
    mp4: "audio/mp4",
  };
  const mimeType = mimeMap[ext] || "audio/mpeg";

  // Call Groq Whisper
  console.log("[WhisperSync] Calling Groq API...");
  const formData = new FormData();
  // Copy Buffer to fresh ArrayBuffer for Blob compatibility
  const audioArrBuf = new ArrayBuffer(audioBuffer.byteLength);
  new Uint8Array(audioArrBuf).set(new Uint8Array(audioBuffer));
  const audioBlob = new Blob([audioArrBuf], { type: mimeType });
  formData.append("file", audioBlob, `audio.${ext}`);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");

  const whisperResponse = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    }
  );

  if (!whisperResponse.ok) {
    const errorText = await whisperResponse.text();
    console.error("[WhisperSync] Groq error:", whisperResponse.status, errorText);
    return { synced: false, reason: "whisper_error", error: errorText };
  }

  const whisperData = await whisperResponse.json();
  const segments = whisperData.segments || [];
  console.log("[WhisperSync] Got", segments.length, "segments");

  if (segments.length === 0) {
    return { synced: false, reason: "no_segments", error: "Whisper tidak mengembalikan segment" };
  }

  // Parse lyrics
  const lyricLines = lyrics
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

  // Sequential forced alignment
  console.log("[WhisperSync] Sequential alignment:", lyricLines.length, "lyrics,", segments.length, "segments");
  const alignedLyrics = sequentialAlign(lyricLines, segments, audioDuration);

  // Save to DB
  await db
    .update(renders)
    .set({ lyricsSynced: JSON.stringify(alignedLyrics) })
    .where(eq(renders.id, renderId));

  console.log("[WhisperSync] Saved aligned lyrics to DB:", alignedLyrics.length, "lines");

  return { synced: true, segmentCount: segments.length };
}
