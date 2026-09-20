/**
 * Set pointsResetAt for test user + test login
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/fix-test-user.ts
 */
import postgres from "postgres";

async function fix() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    // Set pointsResetAt to next Monday
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(17, 0, 0, 0); // 00:00 WIB = 17:00 UTC previous day
    
    await client`UPDATE users SET points_reset_at = ${nextMonday.toISOString()}`;
    console.log("✅ Updated pointsResetAt for all users");
    
    // Test login
    console.log("\nTesting login...");
    const response = await fetch("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
      },
      body: JSON.stringify({
        email: "test@autolyrics.local",
        password: "TestPassword123!",
      }),
    });

    const data = await response.json();
    console.log("Login status:", response.status);
    
    if (response.ok) {
      console.log("✅ Login SUCCESS!");
      console.log("Token:", data.token);
    } else {
      console.log("❌ Login FAILED:", data);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

fix();
