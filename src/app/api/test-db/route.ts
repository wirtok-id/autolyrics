import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

// GET /api/test-db
export async function GET() {
  try {
    // Test connection by counting users
    const result = await db.select({ count: users.id }).from(users);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      userCount: result.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
