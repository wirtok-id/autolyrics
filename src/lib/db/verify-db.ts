/**
 * Verify database state after register
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/verify-db.ts
 */
import postgres from "postgres";

async function verify() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    // Check users
    const users = await client`SELECT id, name, email, role, tier, points FROM users`;
    console.log("Users:", users);
    
    // Check accounts
    const accounts = await client`SELECT id, user_id, provider_id FROM accounts`;
    console.log("Accounts:", accounts);
    
    // Check sessions
    const sessions = await client`SELECT id, user_id, token FROM sessions`;
    console.log("Sessions:", sessions);
    
    console.log("\n✅ Database verification complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

verify();
