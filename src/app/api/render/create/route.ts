import { NextRequest, NextResponse } from "next/server";
import { createId } from "@/lib/utils";

// POST /api/render/create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioKey, lyrics, template, audioDuration } = body;

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

    // Calculate points cost
    const pointsCost = audioDuration <= 180 ? 1 : 2;

    // TODO: 
    // 1. Validate user auth
    // 2. Check points balance
    // 3. Check cooldown
    // 4. Deduct points
    // 5. Save render to database
    // 6. Trigger Modal function (or mock for now)

    // Create mock render
    const renderId = createId();

    // TODO: Trigger actual render via Modal
    // For now, simulate processing
    setTimeout(() => {
      console.log(`[Mock] Render ${renderId} completed`);
    }, 5000);

    return NextResponse.json({
      success: true,
      renderId,
      pointsCost,
      message: "Render berhasil dimulai",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
