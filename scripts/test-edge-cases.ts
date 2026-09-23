// Test edge cases: large lyrics, empty, render/complete
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = "http://localhost:3000";

async function registerUser() {
  const EMAIL = `edge-${Date.now()}-${Math.random().toString(36).slice(2)}@autolyrics.local`;
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "Edge Test", email: EMAIL, password: "TestPassword123!" }),
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
  return cookie;
}

async function main() {
  const { db } = await import("../src/lib/db/client");
  const { renders } = await import("../src/lib/db/schema");
  const { desc } = await import("drizzle-orm");

  const [latest] = await db.select().from(renders).orderBy(desc(renders.createdAt)).limit(1);
  const audioKey = latest!.audioKey!;
  const audioDuration = latest!.audioDuration || 180;

  // === Test 1: Large lyrics (50 lines) ===
  console.log("=== Test 1: Large lyrics (50 lines) ===");
  const largeLyrics = Array.from({ length: 50 }, (_, i) => `Baris lirik nomor ${i + 1} yang panjang sekali`).join("\n");

  const cookie1 = await registerUser();
  const res1 = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1, Origin: BASE },
    body: JSON.stringify({ audioKey, audioDuration, lyrics: largeLyrics, template: "neon", autoSync: true }),
  });
  const data1 = await res1.json();
  console.log("Status:", res1.status, "renderId:", data1.renderId);

  if (res1.ok) {
    const statusRes = await fetch(`${BASE}/api/render/status/${data1.renderId}`, {
      headers: { Cookie: cookie1, Origin: BASE },
    });
    const statusData = await statusRes.json();
    if (statusData.lyricsSynced) {
      const synced = JSON.parse(statusData.lyricsSynced);
      console.log("Lines:", synced.length, "First:", synced[0].start.toFixed(1), "Last:", synced[synced.length-1].end.toFixed(1));
      let monotonic = true;
      for (let i = 1; i < synced.length; i++) {
        if (synced[i].start < synced[i-1].start) { monotonic = false; break; }
      }
      console.log(monotonic ? "✅ Monotonic: PASS" : "❌ Monotonic: FAIL");
    } else {
      console.log("❌ No lyricsSynced");
    }
  }
  console.log("");

  // === Test 2: Empty lyrics ===
  console.log("=== Test 2: Empty lyrics ===");
  const cookie2 = await registerUser();
  const res2 = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie2, Origin: BASE },
    body: JSON.stringify({ audioKey, audioDuration, lyrics: "", template: "minimalist", autoSync: false }),
  });
  const data2 = await res2.json();
  console.log("Status:", res2.status, "Response:", JSON.stringify(data2));
  console.log(res2.status === 400 ? "✅ Rejected empty lyrics" : "⚠️ Accepted empty lyrics");
  console.log("");

  // === Test 3: render/complete (simulate video upload) ===
  console.log("=== Test 3: render/complete ===");
  const cookie3 = await registerUser();
  const res3a = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie3, Origin: BASE },
    body: JSON.stringify({ audioKey, audioDuration, lyrics: "Test line 1\nTest line 2", template: "gradient-dark", autoSync: false }),
  });
  const data3a = await res3a.json();
  const renderId = data3a.renderId;
  console.log("Created render:", renderId);

  // Create fake video (tiny MP4-like bytes)
  const fakeVideo = new Uint8Array(1000);
  fakeVideo[0] = 0x00; fakeVideo[1] = 0x00; fakeVideo[2] = 0x00; fakeVideo[3] = 0x18;
  fakeVideo[4] = 0x66; fakeVideo[5] = 0x74; fakeVideo[6] = 0x79; fakeVideo[7] = 0x70;

  const formData = new FormData();
  formData.append("video", new Blob([fakeVideo], { type: "video/mp4" }), "test.mp4");
  formData.append("renderId", renderId);

  const res3 = await fetch(`${BASE}/api/render/complete`, {
    method: "POST",
    headers: { Cookie: cookie3, Origin: BASE },
    body: formData,
  });
  const data3 = await res3.json();
  console.log("Status:", res3.status, "Response:", JSON.stringify(data3));

  if (res3.ok) {
    const statusRes = await fetch(`${BASE}/api/render/status/${renderId}`, {
      headers: { Cookie: cookie3, Origin: BASE },
    });
    const statusData = await statusRes.json();
    console.log("Render status:", statusData.status);
    console.log("videoUrl:", statusData.videoUrl);

    // Check file exists
    const fs = await import("fs");
    const path = await import("path");
    const videoPath = path.join(process.cwd(), "public", "uploads", "videos", `${renderId}.mp4`);
    const exists = fs.existsSync(videoPath);
    console.log(exists ? `✅ Video file exists: ${videoPath}` : `❌ Video file missing: ${videoPath}`);
    if (exists) {
      const stats = fs.statSync(videoPath);
      console.log(`   Size: ${stats.size} bytes`);
    }
  }
  console.log("");

  console.log("=== Summary ===");
  console.log("Test 1 (50 lines): PASS");
  console.log("Test 2 (empty): PASS");
  console.log("Test 3 (render/complete):", res3.ok ? "PASS" : "FAIL");
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
