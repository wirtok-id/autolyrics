import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

interface AlignedLyric {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Simple fuzzy match score
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  
  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;
  
  // Simple word overlap
  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  const intersection = aWords.filter(w => bWords.includes(w));
  const union = new Set([...aWords, ...bWords]);
  
  return intersection.length / union.size;
}

// Linear estimate when no match found
function linearEstimate(
  lineIndex: number, 
  totalLines: number, 
  totalDuration: number
): { start: number; end: number } {
  const segmentDuration = totalDuration / totalLines;
  return {
    start: lineIndex * segmentDuration,
    end: (lineIndex + 1) * segmentDuration,
  };
}

// POST /api/sync/whisper
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Tidak ada session aktif" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { audioBase64, audioMimeType, lyrics, audioDuration } = body;

    // Validation
    if (!audioBase64 || !lyrics || !audioDuration) {
      return NextResponse.json(
        { error: "audioBase64, lyrics, dan audioDuration wajib diisi" },
        { status: 400 }
      );
    }

    // Check if Groq API key exists
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.log("GROQ_API_KEY not set, using linear sync");
      return NextResponse.json({ synced: false, reason: "no_api_key" });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Call Groq Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: audioMimeType || "audio/mpeg" });
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");

    const whisperResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Groq Whisper error:", errorText);
      return NextResponse.json({ synced: false, reason: "whisper_error" });
    }

    const whisperData = await whisperResponse.json();
    const segments: WhisperSegment[] = whisperData.segments || [];

    if (segments.length === 0) {
      return NextResponse.json({ synced: false, reason: "no_segments" });
    }

    // Parse lyrics into lines
    const lyricLines = lyrics
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    // Align lyrics to segments
    const alignedLyrics: AlignedLyric[] = lyricLines.map(
      (line: string, index: number) => {
        // Find best matching segment
        let bestScore = 0;
        let bestSegment: WhisperSegment | null = null;

        for (const segment of segments) {
          const score = similarity(line, segment.text);
          if (score > bestScore) {
            bestScore = score;
            bestSegment = segment;
          }
        }

        // Use matched segment or linear estimate
        if (bestScore > 0.6 && bestSegment) {
          return {
            text: line,
            start: bestSegment.start,
            end: bestSegment.end,
            confidence: bestScore,
          };
        } else {
          const estimate = linearEstimate(index, lyricLines.length, audioDuration);
          return {
            text: line,
            start: estimate.start,
            end: estimate.end,
            confidence: 0.5,
          };
        }
      }
    );

    return NextResponse.json({
      synced: true,
      lyrics: alignedLyrics,
      whisperText: whisperData.text,
      segmentCount: segments.length,
    });
  } catch (error) {
    console.error("Sync whisper error:", error);
    return NextResponse.json({ synced: false, reason: "server_error" });
  }
}
