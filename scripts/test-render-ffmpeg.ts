// Validate the EXACT browser render pipeline using real ffmpeg CLI.
// Uses the same buildFilterComplex/buildExecArgs as the result page.
import { buildFilterComplex, buildExecArgs, type SyncedLyric } from "../src/lib/render/lyrics-filter";
import { spawn } from "child_process";
import { copyFileSync, writeFileSync, existsSync, statSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const FFMPEG = "C:\\Users\\wiruna\\AppData\\Local\\Temp\\opencode\\ffmpegt\\node_modules\\ffmpeg-static\\ffmpeg.exe";
const PROJECT = process.cwd();
const WORK = join(PROJECT, "test-render-work");

// Tricky lyrics: quotes, colon, comma, %, apostrophe, long line
// LYRICS_COUNT env → generate N lines (e.g. 50) spread over duration
const lyricsCount = parseInt(process.env.LYRICS_COUNT || "5", 10);
const trickyFive: SyncedLyric[] = [
  { text: "Baris pertama biasa saja", start: 0, end: 6, confidence: 1 },
  { text: "\"Kutipan\" dan tanda koma, serta: titik dua", start: 6, end: 12, confidence: 1 },
  { text: "Aku 100% yakin ini ujian", start: 12, end: 18, confidence: 1 },
  { text: "O'Neil bertemu di bar's hall", start: 18, end: 24, confidence: 1 },
  { text: "Baris kelima yang sangat panjang sekali agar fontsize turun otomatis dan tidak terpotong", start: 24, end: 30, confidence: 1 },
];
const lyrics: SyncedLyric[] =
  lyricsCount === 5
    ? trickyFive
    : Array.from({ length: lyricsCount }, (_, i) => ({
        text: `Baris ke-${i + 1} dengan teks yang cukup panjang untuk uji render`,
        start: (i * 30) / lyricsCount,
        end: ((i + 1) * 30) / lyricsCount,
        confidence: 1,
      }));
console.log(`Testing with ${lyrics.length} lyric lines`);

function runFfmpeg(args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(FFMPEG, args, { cwd: WORK });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? -1, stderr }));
  });
}

async function main() {
  // Setup workdir mimicking wasm FS root
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });

  copyFileSync(join(PROJECT, "public", "templates", "neon.png"), join(WORK, "bg.png"));
  copyFileSync(join(PROJECT, "public", "fonts", "Inter.ttf"), join(WORK, "Inter.ttf"));
  copyFileSync(join(PROJECT, "public", "uploads", "test-tone-30s.wav"), join(WORK, "input.mp3"));

  const encoder = new TextEncoder();
  lyrics.forEach((l, i) => {
    writeFileSync(join(WORK, `lyr${i}.txt`), encoder.encode(l.text));
  });

  const duration = 30; // WAV is 30s
  const filterComplex = buildFilterComplex(lyrics, duration);
  const args = buildExecArgs(filterComplex, duration); // exact -t cap
  // (in the browser: buildFilterComplex(lyrics, probed ?? browser + 5),
  //  buildExecArgs(fc, probed ?? undefined))

  console.log("=== filter_complex ===");
  console.log(filterComplex);
  console.log("\n=== running ffmpeg ===");

  const t0 = Date.now();
  const { code, stderr } = await runFfmpeg(args);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (code !== 0) {
    console.error("FFMPEG FAILED, code:", code);
    console.error(stderr.split("\n").slice(-15).join("\n"));
    process.exit(1);
  }

  const outFile = join(WORK, "output.mp4");
  if (!existsSync(outFile)) {
    console.error("output.mp4 not created!");
    process.exit(1);
  }
  const size = statSync(outFile).size;
  console.log(`\nOK in ${elapsed}s, size: ${(size / 1024 / 1024).toFixed(2)} MB`);

  // Probe with ffmpeg -i (parse stream info)
  const probe = await runFfmpeg(["-i", "output.mp4"]);
  const info = probe.stderr;
  const videoLine = info.split("\n").find((l) => l.includes("Video:"));
  const audioLine = info.split("\n").find((l) => l.includes("Audio:"));
  const durMatch = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);

  console.log("\n=== Output info ===");
  console.log("Video:", videoLine?.trim());
  console.log("Audio:", audioLine?.trim());
  console.log("Duration:", durMatch ? `${durMatch[1]}:${durMatch[2]}:${durMatch[3]}` : "?");

  // Validate spec
  const checks: [string, boolean][] = [
    ["exit code 0", code === 0],
    ["file exists & >100KB", size > 100 * 1024],
    ["1280x720", !!videoLine?.includes("1280x720")],
    ["30 fps", !!videoLine?.includes("30 fps") || !!videoLine?.includes("30 tbr")],
    ["h264", !!videoLine?.includes("h264")],
    ["aac audio", !!audioLine?.includes("aac")],
    ["duration ~30s (00:00:30)", durMatch?.[1] === "00" && durMatch?.[2] === "00" && parseFloat(durMatch[3]) >= 29.5 && parseFloat(durMatch[3]) <= 30.5],
  ];

  console.log("\n=== Checks ===");
  let pass = true;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "✅" : "❌"} ${name}`);
    if (!ok) pass = false;
  }

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
