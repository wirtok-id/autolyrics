/**
 * Sequential Forced Alignment
 * Maps user lyrics to Whisper segments by order, with fuzzy matching
 * and interpolation for unmatched lines.
 */

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

export interface AlignedLyric {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// ---- Text normalization & similarity ----

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\[\]{}]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

function jaccard(a: string, b: string): number {
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  if (aTokens.size === 0 && bTokens.size === 0) return 1;

  let intersection = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersection++;
  }
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function similarity(a: string, b: string): number {
  const aNorm = normalize(a);
  const bNorm = normalize(b);

  if (aNorm === bNorm) return 1;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.9;

  const maxLen = Math.max(aNorm.length, bNorm.length);
  if (maxLen === 0) return 1;

  const levScore = 1 - levenshtein(aNorm, bNorm) / maxLen;
  const jacScore = jaccard(aNorm, bNorm);

  return levScore * 0.5 + jacScore * 0.5;
}

// ---- Noise filtering ----

const NOISE_PATTERNS =
  /^(ha[-\s]?ha|oh|yeah|mmm|ooh|ah|uh|la[-\s]?la|na[-\s]?na|da[-\s]?da|du[-\s]?du)$/i;

function isNoise(text: string): boolean {
  const norm = normalize(text);
  if (norm.length < 3) return true;
  if (NOISE_PATTERNS.test(norm)) return true;
  if (norm.length < 8 && /^(\w+)\s+\1(\s+\1)*$/.test(norm)) return true;
  return false;
}

function countNullsBetween(
  arr: { start: number | null }[],
  from: number,
  to: number
): number {
  let count = 0;
  for (let i = from + 1; i < to; i++) {
    if (arr[i].start === null) count++;
  }
  return count;
}

/**
 * Sequential forced alignment:
 * - Iterate user lyrics in order
 * - For each, search forward window of segments from last matched index
 * - Assign timestamp if match found, else mark for interpolation
 * - Interpolate missing entries
 * - Enforce monotonic order
 */
export function sequentialAlign(
  userLyrics: string[],
  whisperSegments: WhisperSegment[],
  totalDuration: number
): AlignedLyric[] {
  if (whisperSegments.length === 0 || userLyrics.length === 0) {
    return userLyrics.map((text, i) => ({
      text,
      start: (i / userLyrics.length) * totalDuration,
      end: ((i + 1) / userLyrics.length) * totalDuration,
      confidence: 0,
    }));
  }

  // Filter noise segments
  const segments = whisperSegments.filter((s) => !isNoise(s.text));
  console.log(
    "[Align] Filtered",
    whisperSegments.length - segments.length,
    "noise segments,",
    segments.length,
    "remaining"
  );

  if (segments.length === 0) {
    return userLyrics.map((text, i) => ({
      text,
      start: (i / userLyrics.length) * totalDuration,
      end: ((i + 1) / userLyrics.length) * totalDuration,
      confidence: 0,
    }));
  }

  const WINDOW = 10;
  let lastIdx = 0;

  // Pass 1: sequential matching
  const result: {
    text: string;
    start: number | null;
    end: number | null;
    confidence: number;
  }[] = userLyrics.map((line, i) => {
    let bestScore = 0;
    let bestMatch: WhisperSegment | null = null;
    let bestIdx = lastIdx;

    const windowEnd = Math.min(lastIdx + WINDOW, segments.length);

    for (let j = lastIdx; j < windowEnd; j++) {
      const score = similarity(line, segments[j].text);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = segments[j];
        bestIdx = j;
      }
    }

    if (bestMatch && bestScore > 0.45) {
      console.log(
        `[Align] Line ${i} "${line.substring(0, 30)}..." → seg ${bestIdx} "${bestMatch.text.substring(0, 30)}..." score=${bestScore.toFixed(2)} @ ${bestMatch.start.toFixed(1)}s-${bestMatch.end.toFixed(1)}s`
      );
      lastIdx = bestIdx + 1;

      return {
        text: line,
        start: bestMatch.start,
        end: bestMatch.end,
        confidence: bestScore,
      };
    } else {
      console.log(
        `[Align] Line ${i} "${line.substring(0, 30)}..." → NO MATCH (best=${bestScore.toFixed(2)}), will interpolate`
      );
      return {
        text: line,
        start: null,
        end: null,
        confidence: 0,
      };
    }
  });

  // Pass 2: interpolate null entries
  for (let i = 0; i < result.length; i++) {
    if (result[i].start !== null) continue;

    let prevIdx = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (result[j].start !== null) {
        prevIdx = j;
        break;
      }
    }

    let nextIdx = -1;
    for (let j = i + 1; j < result.length; j++) {
      if (result[j].start !== null) {
        nextIdx = j;
        break;
      }
    }

    if (prevIdx >= 0 && nextIdx >= 0) {
      const prevEnd = result[prevIdx].end!;
      const nextStart = result[nextIdx].start!;
      const gap = nextStart - prevEnd;
      const nullCount = countNullsBetween(result, prevIdx, nextIdx);
      const slotSize = gap / (nullCount + 1);
      const position = countNullsBetween(result, prevIdx, i);

      const newStart = prevEnd + slotSize * position;
      result[i].start = newStart;
      result[i].end = newStart + slotSize * 0.9;
      result[i].confidence = 0.5;

      console.log(
        `[Align] Line ${i} interpolated @ ${newStart.toFixed(1)}s-${(newStart + slotSize * 0.9).toFixed(1)}s`
      );
    } else if (prevIdx >= 0) {
      const prevEnd = result[prevIdx].end!;
      result[i].start = prevEnd;
      result[i].end = prevEnd + 3;
      result[i].confidence = 0.3;
    } else if (nextIdx >= 0) {
      const nextStart = result[nextIdx].start!;
      result[i].start = Math.max(0, nextStart - 3);
      result[i].end = nextStart;
      result[i].confidence = 0.3;
    } else {
      result[i].start = (i / result.length) * totalDuration;
      result[i].end = ((i + 1) / result.length) * totalDuration;
      result[i].confidence = 0;
    }
  }

  // Pass 3: enforce monotonic order
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1];
    const curr = result[i];

    if (curr.start! < prev.end!) {
      curr.start = prev.end!;
      if (curr.end! < curr.start!) {
        curr.end = curr.start! + 2;
      }
    }
  }

  // Final log
  console.log("[Align] Final alignment:");
  result.forEach((r, i) =>
    console.log(
      `  [${i}] "${r.text.substring(0, 30)}..." @ ${r.start!.toFixed(1)}s-${r.end!.toFixed(1)}s (conf: ${r.confidence.toFixed(2)})`
    )
  );

  return result.map((r) => ({
    text: r.text,
    start: r.start!,
    end: r.end!,
    confidence: r.confidence,
  }));
}
