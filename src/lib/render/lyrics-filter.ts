// Shared between result page (browser) and test scripts (node)
export interface SyncedLyric {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Build ffmpeg drawtext filter for lyrics.
// Uses textfile= to avoid ALL filtergraph escaping issues (quotes, colons,
// commas, backslashes, %{} expansion in lyric text).
export function buildLyricsFilter(lyrics: SyncedLyric[]): string {
  if (lyrics.length === 0) {
    return "drawtext=fontfile=Inter.ttf:text=' ':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=h-200";
  }

  return lyrics
    .map((line, i) => {
      const start = Math.max(0, line.start).toFixed(3);
      const end = Math.max(0, line.end).toFixed(3);
      // Dynamic fontsize so long lines fit in 1280px (0.55 ≈ avg char width ratio)
      const fontsize = Math.max(
        28,
        Math.min(56, Math.floor(1180 / (Math.max(line.text.length, 1) * 0.55)))
      );
      return [
        `drawtext=fontfile=Inter.ttf`,
        `textfile=lyr${i}.txt`,
        `expansion=none`,
        `fontsize=${fontsize}`,
        `fontcolor=white`,
        `x=(w-text_w)/2`,
        `y=h-200`,
        `shadowcolor=black@0.8`,
        `shadowx=3`,
        `shadowy=3`,
        `borderw=3`,
        `bordercolor=black@0.5`,
        `enable='between(t\\,${start}\\,${end})'`,
      ].join(":");
    })
    .join(",");
}

// Build the full filter_complex string exactly as used in the browser render.
// trimDuration: how long the video chain runs. Pass probed audio duration
// (exact) or browserDuration + 5 (estimate with slack); -t/-shortest caps
// the final output either way.
export function buildFilterComplex(
  lyrics: SyncedLyric[],
  trimDuration: number
): string {
  // fps=30: PNG image input defaults to 25fps — force spec 30fps.
  return [
    `[0:v]trim=duration=${trimDuration},setpts=PTS-STARTPTS,fps=30[bg]`,
    `[bg]${buildLyricsFilter(lyrics)}[out]`,
  ].join(";");
}

// ffmpeg args exactly as used in the browser render.
// capDuration: exact audio duration (from ffprobe) → -t hard-caps output.
// Old wasm ffmpeg has imprecise -shortest (video tail up to ~1.4s past
// audio end), so prefer -t when a probed duration is available.
export function buildExecArgs(
  filterComplex: string,
  capDuration?: number
): string[] {
  const args = [
    "-loop", "1",
    "-i", "bg.png",
    "-i", "input.mp3",
    "-filter_complex", filterComplex,
    "-map", "[out]",
    "-map", "1:a",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
  ];

  if (capDuration !== undefined && capDuration > 0) {
    args.push("-t", capDuration.toFixed(3));
  } else {
    args.push("-shortest");
  }

  args.push("-y", "output.mp4");
  return args;
}
