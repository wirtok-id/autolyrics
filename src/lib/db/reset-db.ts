/**
 * Reset database - drop all tables and re-create
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/reset-db.ts
 */
import postgres from "postgres";

async function reset() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    console.log("Dropping all tables...");
    await client`DROP TABLE IF EXISTS verification_tokens, accounts, sessions, point_logs, renders, users CASCADE`;
    console.log("✅ All tables dropped!");
    
    console.log("\nVerifying tables are gone...");
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Remaining tables:", tables.map(t => t.table_name));
    
  } catch (error) {
    console.error("❌ Reset failed:", error);
  } finally {
    await client.end();
  }
}

reset();
