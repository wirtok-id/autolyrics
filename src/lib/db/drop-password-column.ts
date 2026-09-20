/**
 * Drop password column from users table (Better Auth handles it internally)
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/drop-password-column.ts
 */
import postgres from "postgres";

async function migrate() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    // Check if column exists
    const colCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `;
    
    if (colCheck.length > 0) {
      console.log("Dropping password column...");
      await client`ALTER TABLE users DROP COLUMN password`;
      console.log("✅ Column dropped successfully!");
    } else {
      console.log("✅ Column 'password' doesn't exist, nothing to do.");
    }

    // Verify
    const cols = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log("\nUsers table columns:");
    cols.forEach((c) => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
