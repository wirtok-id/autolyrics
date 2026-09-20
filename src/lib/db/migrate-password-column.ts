/**
 * Manual migration: rename password_hash -> password in Neon
 * Run: npx tsx src/lib/db/migrate-password-column.ts
 */
import postgres from "postgres";

async function migrate() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    // Check if column exists
    const colCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `;
    
    if (colCheck.length > 0) {
      console.log("Renaming password_hash -> password...");
      await client`ALTER TABLE users RENAME COLUMN password_hash TO password`;
      console.log("✅ Column renamed successfully!");
    } else {
      console.log("✅ Column 'password' already exists, nothing to do.");
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
