import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// POST /api/render/complete
// Receives the rendered video file and saves it locally
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

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const renderId = formData.get("renderId") as string;

    if (!videoFile || !renderId) {
      return NextResponse.json(
        { error: "video dan renderId wajib diisi" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json(
        { error: "Format video tidak didukung" },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran video terlalu besar (maks 500MB)" },
        { status: 400 }
      );
    }

    // Verify render exists and user owns it
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
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    // Create videos directory
    const videosDir = join(process.cwd(), "public", "uploads", "videos");
    await mkdir(videosDir, { recursive: true });

    // Save video file with renderId as filename
    const filename = `${renderId}.mp4`;
    const filepath = join(videosDir, filename);
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(filepath, buffer);

    // Update render record
    const videoUrl = `/uploads/videos/${filename}`;
    await db
      .update(renders)
      .set({
        status: "done",
        videoUrl,
        completedAt: new Date(),
      })
      .where(eq(renders.id, renderId));

    return NextResponse.json({
      success: true,
      videoUrl,
      message: "Video berhasil disimpan",
    });
  } catch (error) {
    console.error("Render complete error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan video" },
      { status: 500 }
    );
  }
}
