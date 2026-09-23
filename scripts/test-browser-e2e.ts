// Browser E2E: full render flow in real Chromium via Playwright.
// Register → upload audio → create render → open /result → click Mulai Render
// → wait done → verify uploaded MP4 spec on disk.
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PW = "C:\\Users\\wiruna\\AppData\\Local\\Temp\\opencode\\ffmpegt";
const FFMPEG = "C:\\Users\\wiruna\\AppData\\Local\\Temp\\opencode\\ffmpegt\\node_modules\\ffmpeg-static\\ffmpeg.exe";

const lyrics = [
  "Baris pertama biasa saja",
  "\"Kutipan\" dan tanda koma, serta: titik dua",
  "Aku 100% yakin ini ujian",
  "O'Neil bertemu di bar's hall",
  "Baris kelima yang sangat panjang sekali agar fontsize turun otomatis dan tidak terpotong",
].join("\n");

async function main() {
  const fs = await import("fs");
  const path = await import("path");
  const { spawn } = await import("child_process");

  // --- 1. API setup: register, upload, create render ---
  console.log("=== Step 1: Register ===");
  const EMAIL = `pw-test-${Date.now()}@autolyrics.local`;
  const regRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "PW Test", email: EMAIL, password: "TestPassword123!" }),
  });
  if (!regRes.ok) throw new Error(`register failed: ${regRes.status}`);
  const setCookie = regRes.headers.get("set-cookie") || "";
  const sessionToken = setCookie
    .split(";")[0]
    .replace("better-auth.session_token=", "");
  console.log("registered:", EMAIL, "token:", sessionToken.slice(0, 20) + "...");
  if (!sessionToken) throw new Error("no session token");

  console.log("\n=== Step 2: Upload test WAV ===");
  const wavPath = path.join(process.cwd(), "public", "uploads", "test-tone-30s.wav");
  const wavBuf = fs.readFileSync(wavPath);
  const presignRes = await fetch(`${BASE}/api/upload/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ fileName: "test-tone-30s.wav", fileType: "audio/wav" }),
  });
  const presign = await presignRes.json();
  const upForm = new FormData();
  upForm.append("file", new Blob([new Uint8Array(wavBuf)], { type: "audio/wav" }), "test-tone-30s.wav");
  const upRes = await fetch(presign.uploadUrl, { method: "POST", body: upForm, headers: { Origin: BASE } });
  const upData = await upRes.json();
  console.log("uploaded:", upData.publicUrl);
  if (!upRes.ok) throw new Error("upload failed");

  console.log("\n=== Step 3: Create render (autoSync off) ===");
  const createWithCookie = await fetch(`${BASE}/api/render/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `better-auth.session_token=${sessionToken}`,
      Origin: BASE,
    },
    body: JSON.stringify({
      audioKey: upData.publicUrl,
      audioDuration: 30,
      lyrics,
      template: "neon",
      autoSync: false,
    }),
  });
  const createData = await createWithCookie.json();
  console.log("create:", createWithCookie.status, JSON.stringify(createData));
  if (!createWithCookie.ok) throw new Error("create render failed");
  const renderId = createData.renderId;

  // --- 2. Browser E2E ---
  console.log("\n=== Step 4: Launch Chromium ===");
  const { pathToFileURL } = await import("url");
  const pwUrl = pathToFileURL(path.join(PW, "node_modules", "playwright", "index.mjs")).href;
  const { chromium } = await import(pwUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
    },
  ]);
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  page.on("console", (msg: any) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(line);
    if (consoleLogs.length > 300) consoleLogs.shift();
  });
  page.on("pageerror", (err: any) => {
    consoleLogs.push(`[PAGEERROR] ${err.message}`);
  });

  console.log("=== Step 5: Open result page ===");
  await page.goto(`${BASE}/result/${renderId}`, { waitUntil: "networkidle", timeout: 120000 });

  // Wait for & click "Mulai Render"
  const startBtn = page.getByRole("button", { name: /Mulai Render/i });
  try {
    await startBtn.waitFor({ state: "visible", timeout: 60000 });
  } catch (e) {
    console.log("=== DIAG: button not found ===");
    const body = await page.textContent("body");
    console.log("URL:", page.url());
    console.log("body excerpt:", body?.slice(0, 1000));
    console.log("--- console logs ---");
    consoleLogs.slice(-30).forEach((l) => console.log(l));
    const diagShot = path.join(process.cwd(), "test-render-work", "diag.png");
    await page.screenshot({ path: diagShot, fullPage: true });
    console.log("screenshot:", diagShot);
    await browser.close();
    process.exit(1);
  }
  console.log("Clicking Mulai Render...");
  const t0 = Date.now();
  await startBtn.click();

  // Wait until done (Video Siap) or error — poll page text
  let finalState = "unknown";
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    if (body?.includes("Video Siap")) { finalState = "done"; break; }
    if (body?.includes("Render Gagal")) { finalState = "failed"; break; }
    // progress info
    const pct = body?.match(/(\d+)%/);
    if (pct) {
      process.stdout.write(`\rprogress: ${pct[1]}%  elapsed: ${Math.round((Date.now() - t0) / 1000)}s   `);
    }
  }
  console.log(`\n=== Final state: ${finalState} (${Math.round((Date.now() - t0) / 1000)}s) ===`);

  // Screenshot
  const shotPath = path.join(process.cwd(), "test-render-work", "browser-result.png");
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log("screenshot:", shotPath);

  if (finalState !== "done") {
    console.log("\n--- last console logs ---");
    consoleLogs.slice(-40).forEach((l) => console.log(l));
    const body = await page.textContent("body");
    console.log("\n--- page text (excerpt) ---");
    console.log(body?.slice(0, 800));
    await browser.close();
    process.exit(1);
  }

  await browser.close();

  // --- 3. Verify uploaded MP4 ---
  console.log("\n=== Step 6: Verify output MP4 ===");
  const outFile = path.join(process.cwd(), "public", "uploads", "videos", `${renderId}.mp4`);
  if (!fs.existsSync(outFile)) {
    console.error("❌ output file missing:", outFile);
    process.exit(1);
  }
  const size = fs.statSync(outFile).size;
  console.log(`file: ${outFile} (${(size / 1024 / 1024).toFixed(2)} MB)`);

  const probe = await new Promise<string>((resolve) => {
    const p = spawn(FFMPEG, ["-i", outFile]);
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d));
    p.on("close", () => resolve(stderr));
  });
  const videoLine = probe.split("\n").find((l) => l.includes("Video:"));
  const audioLine = probe.split("\n").find((l) => l.includes("Audio:"));
  const dur = probe.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  console.log("Video:", videoLine?.trim());
  console.log("Audio:", audioLine?.trim());
  console.log("Duration:", dur ? `${dur[1]}:${dur[2]}:${dur[3]}` : "?");

  const checks: [string, boolean][] = [
    ["file exists & >50KB", size > 50 * 1024],
    ["1280x720", !!videoLine?.includes("1280x720")],
    ["30 fps", !!videoLine?.includes("30 fps")],
    ["h264", !!videoLine?.includes("h264")],
    ["aac", !!audioLine?.includes("aac")],
    ["duration ~30s", dur?.[2] === "00" && parseFloat(dur[3]) >= 29 && parseFloat(dur[3]) <= 31],
    ["browser render done", finalState === "done"],
  ];
  console.log("\n=== Checks ===");
  let pass = true;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "✅" : "❌"} ${name}`);
    if (!ok) pass = false;
  }

  console.log("\n--- console logs (render-related) ---");
  consoleLogs
    .filter((l) => /Render|ffmpeg|error|Error|FS/i.test(l))
    .slice(0, 50)
    .forEach((l) => console.log(l));

  console.log("\nrenderId:", renderId);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
