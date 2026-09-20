/**
 * Database initialization helper
 * Run this script to verify connection and push schema
 * 
 * Usage: npx tsx src/lib/db/init.ts
 */

import { db } from "./client";
import { users } from "./schema";

async function init() {
  console.log("🔗 Connecting to Neon PostgreSQL...");
  
  try {
    // Test connection
    const result = await db.select().from(users).limit(1);
    console.log("✅ Database connection successful!");
    console.log(`📊 Users table accessible (${result.length} rows found)`);
    
    // Test counting users
    const countResult = await db.select({ count: users.id }).from(users);
    console.log(`👥 Total users: ${countResult.length}`);
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

init();
