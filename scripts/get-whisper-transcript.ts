// Test: Get Whisper transcript to verify matching works
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const fs = await import("fs");
  const path = await import("path");

  const { db } = await import("../src/lib/db/client");
  const { renders } = await import("../src/lib/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  // Get latest render
  const [latest] = await db
    .select()
    .from(renders)
    .orderBy(desc(renders.createdAt))
    .limit(1);

  if (!latest) {
    console.error("No renders found");
    process.exit(1);
  }

  console.log("Render ID:", latest.id);
  console.log("Audio:", latest.audioKey);

  // Read audio
  const audioPath = path.join(process.cwd(), "public", latest.audioKey!);
  const audioBuf = fs.readFileSync(audioPath);
  console.log("Audio size:", audioBuf.length, "bytes");

  // Call Groq Whisper directly
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error("GROQ_API_KEY not set");
    process.exit(1);
  }

  console.log("\nCalling Groq Whisper...");
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuf)], { type: "audio/mpeg" });
  formData.append("file", blob, "audio.mp3");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}` },
    body: formData,
  });

  if (!res.ok) {
    console.error("Groq error:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("\n=== Full Transcript ===");
  console.log(data.text);

  console.log("\n=== Segments ===");
  data.segments.forEach((seg: any, i: number) => {
    console.log(
      `  [${i}] "${seg.text.trim()}" @ ${seg.start.toFixed(2)}s-${seg.end.toFixed(2)}s`
    );
  });

  console.log("\nTotal segments:", data.segments.length);
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
