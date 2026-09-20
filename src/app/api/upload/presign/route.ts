import { NextRequest, NextResponse } from "next/server";
import { createId } from "@/lib/utils";

// POST /api/upload/presign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType } = body;

    // Validation
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName dan fileType wajib diisi" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/x-m4a",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Format file tidak didukung" },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = `audio/${createId()}/${fileName}`;

    // TODO: Generate actual presigned URL for Supabase/R2
    // For now, return mock presigned URL
    const mockPresignedUrl = {
      uploadUrl: `https://placeholder-storage.com/upload/${key}?mock-signature`,
      key,
      publicUrl: `https://placeholder-storage.com/public/${key}`,
    };

    return NextResponse.json({
      success: true,
      ...mockPresignedUrl,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
