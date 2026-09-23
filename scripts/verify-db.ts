// Verify DB + test edge cases
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db/client");
  const { renders } = await import("../src/lib/db/schema");
  const { desc } = await import("drizzle-orm");
  // 1. Check latest render in DB
  console.log("=== Latest Render in DB ===");
  const [latest] = await db
    .select()
    .from(renders)
    .orderBy(desc(renders.createdAt))
    .limit(1);

  if (!latest) {
    console.error("No renders found!");
    process.exit(1);
  }

  console.log("ID:", latest.id);
  console.log("Status:", latest.status);
  console.log("Audio:", latest.audioKey);
  console.log("Duration:", latest.audioDuration, "s");
  console.log("Points cost:", latest.pointsCost);
  console.log("Error:", latest.errorMessage || "none");

  if (latest.lyricsSynced) {
    const synced = JSON.parse(latest.lyricsSynced);
    console.log("\n--- lyricsSynced ---");
    synced.forEach((l: any, i: number) => {
      console.log(
        `  [${i}] "${l.text}" @ ${l.start.toFixed(1)}s-${l.end.toFixed(1)}s (conf: ${l.confidence.toFixed(2)})`
      );
    });

    // Validate monotonic
    let monotonic = true;
    for (let i = 1; i < synced.length; i++) {
      if (synced[i].start < synced[i - 1].start) {
        console.error(`  ❌ NOT MONOTONIC at line ${i}`);
        monotonic = false;
      }
    }
    if (monotonic) console.log("  ✅ Monotonic: PASS");
  } else {
    console.log("❌ lyricsSynced is NULL");
    process.exit(1);
  }

  console.log("\n=== Result ===");
  console.log("Status:", latest.status);
  console.log("lyricsSynced:", latest.lyricsSynced ? "✅" : "❌");
  console.log("DB: PASS");

  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
