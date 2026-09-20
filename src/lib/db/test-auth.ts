/**
 * Test Better Auth config loads correctly
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/test-auth.ts
 */
import { auth } from "../auth";

async function test() {
  try {
    console.log("✅ Auth config loaded successfully");
    console.log("   emailAndPassword enabled:", (auth as any).options?.emailAndPassword?.enabled);
  } catch (error) {
    console.error("❌ Auth config failed:", error);
  }
}

test();
