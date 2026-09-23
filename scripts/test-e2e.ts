// Test script: register a test user, upload audio, test whisper alignment, create render
const BASE = "http://localhost:3000";

async function main() {
  const EMAIL = `test-${Date.now()}@autolyrics.local`;
  const PASSWORD = "TestPassword123!";

  // Step 1: Register
  console.log("=== Step 1: Register ===");
  const regRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "E2E Test", email: EMAIL, password: PASSWORD }),
  });
  const regData = await regRes.json();
  console.log("Register status:", regRes.status);
  if (!regRes.ok) {
    console.error("Register failed:", regData);
    process.exit(1);
  }
  console.log("User:", regData.user?.email);

  // Extract cookies from register response
  const setCookie = regRes.headers.get("set-cookie") || "";
  const cookieHeader = setCookie
    .split(",")
    .map((c) => c.split(";")[0])
    .join("; ");
  console.log("Cookie:", cookieHeader ? cookieHeader.substring(0, 50) + "..." : "NONE");

  // Step 2: Upload audio (use existing file)
  console.log("\n=== Step 2: Upload audio ===");
  const fs = await import("fs");
  const path = await import("path");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const files = fs.readdirSync(uploadsDir).filter((f) => f.endsWith(".mp3"));
  if (files.length === 0) {
    console.error("No audio files in public/uploads");
    process.exit(1);
  }
  const audioPath = path.join(uploadsDir, files[0]);
  const audioBuf = fs.readFileSync(audioPath);
  console.log("Using audio:", files[0], audioBuf.length, "bytes");

  // Determine duration using ffprobe or estimate
  // We'll set 30s as test duration (files are ~3.7MB which is likely 3 min)
  const audioDuration = 180; // 3 minutes estimate

  // Step 3: Create render (this triggers Whisper sync server-side)
  console.log("\n=== Step 3: Create render (triggers Whisper) ===");
  const lyrics = [
    "Tahun lalu berjuta",
    "Maaf tak bisa pulang",
    "Kali ini sudah lumayan",
    "Ku usahakan kembali",
  ].join("\n");

  const presignRes = await fetch(`${BASE}/api/upload/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ fileName: files[0], fileType: "audio/mpeg" }),
  });
  const presignData = await presignRes.json();
  console.log("Presign:", presignData.uploadUrl, presignData.key);

  // Upload audio via mock endpoint
  const formData = new FormData();
  const blob = new Blob([audioBuf], { type: "audio/mpeg" });
  formData.append("file", blob, files[0]);

  const uploadRes = await fetch(presignData.uploadUrl, {
    method: "POST",
    body: formData,
    headers: { Cookie: cookieHeader, Origin: BASE },
  });
  const uploadData = await uploadRes.json();
  console.log("Upload status:", uploadRes.status, "publicUrl:", uploadData.publicUrl);

  if (!uploadRes.ok) {
    console.error("Upload failed:", uploadData);
    process.exit(1);
  }

  const publicUrl = uploadData.publicUrl;

  // Create render
  const createRes = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Origin: BASE,
    },
    body: JSON.stringify({
      audioKey: publicUrl,
      audioDuration,
      lyrics,
      template: "gradient-dark",
      autoSync: true,
    }),
  });
  const createData = await createRes.json();
  console.log("Create render status:", createRes.status);
  console.log("Response:", JSON.stringify(createData, null, 2));

  if (!createRes.ok) {
    console.error("Create render failed!");
    process.exit(1);
  }

  const renderId = createData.renderId;

  // Step 4: Check render status
  console.log("\n=== Step 4: Check render status ===");
  const statusRes = await fetch(`${BASE}/api/render/status/${renderId}`, {
    headers: { Cookie: cookieHeader, Origin: BASE },
  });
  const statusData = await statusRes.json();
  console.log("Status:", statusData.status);
  console.log("lyricsSynced:", statusData.lyricsSynced ? "YES" : "NO");

  if (statusData.lyricsSynced) {
    const synced = JSON.parse(statusData.lyricsSynced);
    console.log("\n--- Aligned Lyrics ---");
    synced.forEach((l: any, i: number) => {
      console.log(
        `  [${i}] "${l.text}" @ ${l.start.toFixed(1)}s-${l.end.toFixed(1)}s (conf: ${l.confidence.toFixed(2)})`
      );
    });

    // Validate: timestamps must be monotonically increasing
    let monotonic = true;
    for (let i = 1; i < synced.length; i++) {
      if (synced[i].start < synced[i - 1].start) {
        console.error(`  ❌ NOT MONOTONIC at line ${i}: ${synced[i].start} < ${synced[i-1].start}`);
        monotonic = false;
      }
    }
    if (monotonic) console.log("  ✅ Timestamps are monotonically increasing");
  } else {
    console.log("❌ No lyricsSynced found — Whisper sync failed!");
    console.log("errorMessage:", statusData.errorMessage);
  }

  console.log("\n=== Result ===");
  console.log("renderId:", renderId);
  console.log("status:", statusData.status);

  // Save for later use
  fs.writeFileSync(
    path.join(process.cwd(), "test-result.json"),
    JSON.stringify({ renderId, cookieHeader, status: statusData.status }, null, 2)
  );
  console.log("Saved to test-result.json");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
