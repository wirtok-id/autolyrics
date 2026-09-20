/**
 * Render abstraction layer
 * Currently mocks the render process
 * In production, this will call Modal/Render.com
 */

export interface RenderJob {
  id: string;
  audioUrl: string;
  lyrics: Array<{ text: string; start: number; end: number }>;
  template: "gradient-dark" | "neon" | "minimalist";
  userId: string;
  duration: number;
}

export interface RenderResult {
  videoUrl: string;
  duration: number;
  fileSize: number;
}

/**
 * Render video from audio + synced lyrics
 * Currently returns mock result
 * TODO: Integrate with Modal/Render.com for actual FFmpeg rendering
 */
export async function renderVideo(job: RenderJob): Promise<RenderResult> {
  console.log(`[Render] Starting job ${job.id}`);
  console.log(`[Render] Template: ${job.template}`);
  console.log(`[Render] Lyrics lines: ${job.lyrics.length}`);
  console.log(`[Render] Duration: ${job.duration}s`);

  // Simulate render time (5-10 seconds)
  await new Promise((r) => setTimeout(r, 5000 + Math.random() * 5000));

  // Mock result
  const result: RenderResult = {
    videoUrl: `https://placeholder.com/videos/${job.id}.mp4`,
    duration: job.duration,
    fileSize: 1024 * 1024 * 5, // 5MB
  };

  console.log(`[Render] Completed job ${job.id}`);
  console.log(`[Render] Video URL: ${result.videoUrl}`);

  return result;
}

/**
 * Get render template configuration
 */
export function getTemplateConfig(template: string) {
  switch (template) {
    case "gradient-dark":
      return {
        background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
        textColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        fontSize: 48,
      };
    case "neon":
      return {
        background: "#000000",
        textColor: "#00ffff",
        fontFamily: "Orbitron, monospace",
        fontSize: 42,
        glow: true,
      };
    case "minimalist":
      return {
        background: "#1a1a2e",
        textColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        fontSize: 44,
      };
    default:
      return {
        background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
        textColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        fontSize: 48,
      };
  }
}
