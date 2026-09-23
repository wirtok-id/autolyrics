import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";
import { sequentialAlign, type WhisperSegment } from "@/lib/align";

// ---- API Handler ----

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

    const body = await request.json();
    const { renderId, lyrics } = body;

    console.log("[Whisper] Request:", { renderId, lyricsLength: lyrics?.length });

    if (!renderId || !lyrics) {
      return NextResponse.json(
        { error: "renderId dan lyrics wajib diisi" },
        { status: 400 }
      );
    }

    // Get render
    const render = await db.query.renders.findFirst({
      where: eq(renders.id, renderId),
    });

    if (!render) {
      return NextResponse.json(
        { error: "Render tidak ditemukan" },
        { status: 404 }
      );
    }

    if (render.userId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Read audio file
    const audioPath = render.audioKey || render.audioUrl;
    if (!audioPath) {
      return NextResponse.json({ synced: false, reason: "no_audio" });
    }

    const fullPath = join(process.cwd(), "public", audioPath);
    console.log("[Whisper] Reading audio:", fullPath);

    let audioBuffer: Buffer;
    try {
      audioBuffer = await readFile(fullPath);
    } catch (err) {
      console.error("[Whisper] Failed to read audio:", err);
      return NextResponse.json({ synced: false, reason: "audio_not_found" });
    }

    console.log("[Whisper] Audio size:", audioBuffer.length, "bytes");

    // Check Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error("[Whisper] GROQ_API_KEY not set!");
      return NextResponse.json({
        synced: false,
        reason: "no_api_key",
        error: "GROQ_API_KEY tidak dikonfigurasi",
      });
    }

    // MIME type
    const ext = audioPath.split(".").pop()?.toLowerCase() || "mp3";
    const mimeMap: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/x-m4a",
      mp4: "audio/mp4",
    };
    const mimeType = mimeMap[ext] || "audio/mpeg";

    // Call Groq Whisper
    console.log("[Whisper] Calling Groq API...");
    const formData = new FormData();
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
        headers: { Authorization: `Bearer ${groqApiKey}` },
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("[Whisper] Groq error:", whisperResponse.status, errorText);
      return NextResponse.json({
        synced: false,
        reason: "whisper_error",
        error: errorText,
      });
    }

    const whisperData = await whisperResponse.json();
    const rawSegments: WhisperSegment[] = whisperData.segments || [];

    console.log("[Whisper] Got", rawSegments.length, "raw segments from Whisper:");
    rawSegments.forEach((seg, i) =>
      console.log(
        `  [${i}] "${seg.text}" @ ${seg.start.toFixed(2)}s-${seg.end.toFixed(2)}s`
      )
    );

    if (rawSegments.length === 0) {
      return NextResponse.json({
        synced: false,
        reason: "no_segments",
        error: "Whisper tidak mengembalikan segment",
      });
    }

    // Parse lyrics
    const lyricLines = lyrics
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    console.log(
      "[Whisper] Aligning",
      lyricLines.length,
      "lyric lines with",
      rawSegments.length,
      "Whisper segments"
    );

    // Sequential forced alignment
    const alignedLyrics = sequentialAlign(
      lyricLines,
      rawSegments,
      render.audioDuration || 180
    );

    // Save to DB
    await db
      .update(renders)
      .set({ lyricsSynced: JSON.stringify(alignedLyrics) })
      .where(eq(renders.id, renderId));

    console.log("[Whisper] Saved to DB:", alignedLyrics.length, "lines");

    return NextResponse.json({
      synced: true,
      lyrics: alignedLyrics,
      whisperText: whisperData.text,
      segmentCount: rawSegments.length,
    });
  } catch (error) {
    console.error("[Whisper] Server error:", error);
    return NextResponse.json(
      { synced: false, reason: "server_error", error: String(error) }
    );
  }
}
