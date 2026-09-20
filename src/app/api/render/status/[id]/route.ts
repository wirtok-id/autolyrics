import { NextRequest, NextResponse } from "next/server";

// GET /api/render/status/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Render ID wajib diisi" },
        { status: 400 }
      );
    }

    // TODO: Fetch actual render status from database
    // For now, return mock status
    const mockStatus = {
      id,
      status: "done",
      videoUrl: null,
      videoKey: null,
      progress: 100,
      errorMessage: null,
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockStatus);
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
