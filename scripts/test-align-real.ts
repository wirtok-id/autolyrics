// Test alignment with REAL matching lyrics
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = "http://localhost:3000";

async function main() {
  const fs = await import("fs");
  const path = await import("path");

  // Use real lyrics from Whisper transcript (first 4 lines)
  const lyrics = [
    "Berkat doamu dijabah sama kaya",
    "Dan tahun ini ku bisa pulang",
    "Oleh-oleh sudah di tangan",
    "Tapi anehnya bukan kau yang menyambutku",
  ].join("\n");

  console.log("=== Test: Real Matching Lyrics ===");
  console.log("Lyrics:\n" + lyrics);

  // Get existing render's audio
  const { db } = await import("../src/lib/db/client");
  const { renders } = await import("../src/lib/db/schema");
  const { desc } = await import("drizzle-orm");

  const [latest] = await db
    .select()
    .from(renders)
    .orderBy(desc(renders.createdAt))
    .limit(1);

  if (!latest) {
    console.error("No render found");
    process.exit(1);
  }

  const audioKey = latest.audioKey!;
  const audioDuration = latest.audioDuration || 180;

  console.log("\nAudio:", audioKey, "Duration:", audioDuration, "s");

  // Register a fresh user
  const EMAIL = `align-test-${Date.now()}@autolyrics.local`;
  const PASSWORD = "TestPassword123!";

  const regRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "Align Test", email: EMAIL, password: PASSWORD }),
  });
  const regData = await regRes.json();
  console.log("Register:", regRes.status, regData.user?.email);

  const setCookie = regRes.headers.get("set-cookie") || "";
  const cookieHeader = setCookie
    .split(",")
    .map((c) => c.split(";")[0])
    .join("; ");

  // Create render with real lyrics
  console.log("\n=== Creating render ===");
  const createRes = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Origin: BASE,
    },
    body: JSON.stringify({
      audioKey,
      audioDuration,
      lyrics,
      template: "gradient-dark",
      autoSync: true,
    }),
  });
  const createData = await createRes.json();
  console.log("Create status:", createRes.status);
  console.log("Response:", JSON.stringify(createData, null, 2));

  if (!createRes.ok) {
    console.error("Create failed!");
    process.exit(1);
  }

  const renderId = createData.renderId;

  // Get synced lyrics
  console.log("\n=== Checking alignment ===");
  const statusRes = await fetch(`${BASE}/api/render/status/${renderId}`, {
    headers: { Cookie: cookieHeader, Origin: BASE },
  });
  const statusData = await statusRes.json();

  if (!statusData.lyricsSynced) {
    console.error("❌ No lyricsSynced!");
    console.error("Error:", statusData.errorMessage);
    process.exit(1);
  }

  const synced = JSON.parse(statusData.lyricsSynced);
  console.log("\n--- Aligned Lyrics ---");
  synced.forEach((l: any, i: number) => {
    console.log(
      `  [${i}] "${l.text}" @ ${l.start.toFixed(1)}s-${l.end.toFixed(1)}s (conf: ${l.confidence.toFixed(2)})`
    );
  });

  // Validate
  console.log("\n--- Validation ---");
  let monotonic = true;
  for (let i = 1; i < synced.length; i++) {
    if (synced[i].start < synced[i - 1].start) {
      console.error(`  ❌ NOT MONOTONIC at line ${i}: ${synced[i].start} < ${synced[i-1].start}`);
      monotonic = false;
    }
  }
  if (monotonic) console.log("  ✅ Monotonic: PASS");

  const avgConf = synced.reduce((s: number, l: any) => s + l.confidence, 0) / synced.length;
  console.log(`  ${avgConf > 0.5 ? "✅" : "⚠️"} Avg confidence: ${avgConf.toFixed(2)} ${avgConf > 0.5 ? "(good)" : "(low — lyrics may not match)"}`);

  const spread = synced[synced.length - 1].end - synced[0].start;
  console.log(`  ✅ Spread: ${spread.toFixed(1)}s (across ${synced.length} lines)`);

  console.log("\n=== Result ===");
  console.log("renderId:", renderId);
  console.log("monotonic:", monotonic ? "PASS" : "FAIL");
  console.log("avgConfidence:", avgConf.toFixed(2));

  process.exit(monotonic ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
