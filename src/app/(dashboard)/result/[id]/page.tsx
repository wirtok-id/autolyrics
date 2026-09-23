"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import {
  Video,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Music,
  Clock,
  RefreshCw,
  Play,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useRenderStore } from "@/lib/store/render";
import type { SyncedLyric } from "@/lib/render/lyrics-filter";
import { buildFilterComplex, buildExecArgs } from "@/lib/render/lyrics-filter";

type RenderStatus = "pending" | "processing" | "done" | "failed";

interface RenderData {
  id: string;
  lyrics: string;
  lyricsSynced: string | null;
  template: string;
  status: RenderStatus;
  pointsCost: number;
  audioUrl: string | null;
  audioKey: string | null;
  audioDuration: number | null;
  videoUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

// Template → background image filename
const templateBg: Record<string, string> = {
  "gradient-dark": "gradient-dark.png",
  neon: "neon.png",
  minimalist: "minimalist.png",
};

// Write one text file per lyric line into ffmpeg FS (UTF-8)
async function writeLyricFiles(
  ffmpeg: FFmpeg,
  lyrics: SyncedLyric[]
): Promise<number> {
  const encoder = new TextEncoder();
  for (let i = 0; i < lyrics.length; i++) {
    await ffmpeg.writeFile(`lyr${i}.txt`, encoder.encode(lyrics[i].text));
  }
  console.log(`[Render] Wrote ${lyrics.length} lyric text files to FS`);
  return lyrics.length;
}

export default function ResultPage() {
  const params = useParams();
  const renderId = params.id as string;

  const [render, setRender] = useState<RenderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canRender, setCanRender] = useState(true);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const {
    stage,
    progress,
    error: renderError,
    videoUrl: storeVideoUrl,
    setStage,
    setProgress,
    setError,
    setVideoUrl,
    reset,
  } = useRenderStore();

  const fetchRender = useCallback(async () => {
    try {
      const response = await fetch(`/api/render/status/${renderId}`);
      if (response.ok) {
        const data = await response.json();
        setRender(data);
        if (data.status === "done" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStage("done");
        }
        return data.status;
      }
    } catch (err) {
      console.error("Failed to fetch render:", err);
    }
    return null;
  }, [renderId, setVideoUrl, setStage]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const status = await fetchRender();
      // Interrupted render (tab closed/refreshed mid-render): recover to pending
      if (status === "processing") {
        try {
          await fetch(`/api/render/status/${renderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "pending" }),
          });
          await fetchRender();
        } catch { /* ignore */ }
      }
      setIsLoading(false);
    };
    load();
  }, [fetchRender]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.WebAssembly) {
      setCanRender(false);
    }
  }, []);

  const uploadVideo = async (videoBlob: Blob, id: string): Promise<string> => {
    const formData = new FormData();
    formData.append("video", videoBlob, "render.mp4");
    formData.append("renderId", id);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("/api/render/complete", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          return data.videoUrl;
        }
        if (attempt === 2) throw new Error(`Upload gagal setelah 3 percobaan`);
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    throw new Error("Upload gagal");
  };

  const startRender = async () => {
    if (!render) return;

    reset();
    setStage("loading");

    // Mark as processing server-side (prevents double-render on refresh)
    try {
      await fetch(`/api/render/status/${render.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "processing" }),
      });
    } catch { /* non-fatal */ }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    // Keep last log lines for error reporting
    const recentLogs: string[] = [];
    ffmpeg.on("log", ({ message }) => {
      recentLogs.push(message);
      if (recentLogs.length > 40) recentLogs.shift();

      const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch && render.audioDuration) {
        const h = parseInt(timeMatch[1]);
        const m = parseInt(timeMatch[2]);
        const s = parseFloat(timeMatch[3]);
        const currentTime = h * 3600 + m * 60 + s;
        // Rendering phase is 20-90% of total progress
        const renderPct = Math.min(90, 20 + (currentTime / render.audioDuration) * 70);
        setProgress(Math.round(renderPct));
      }
    });

    try {
      // 1. Load ffmpeg.wasm (single-thread)
      setProgress(2);
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      console.log("[Render] ffmpeg loaded successfully");
      setProgress(5);

      // Pre-flight: verify FS works
      try {
        await ffmpeg.writeFile("__test__.txt", new Uint8Array([72, 101, 108, 108, 111])); // "Hello"
        await ffmpeg.deleteFile("__test__.txt");
        console.log("[Render] FS pre-flight: OK");
      } catch (fsErr) {
        console.error("[Render] FS pre-flight FAILED:", fsErr);
        throw new Error("Filesystem ffmpeg.wasm tidak berfungsi. Coba refresh halaman.");
      }

      // 2. Load font
      setStage("downloading-font");
      try {
        const fontData = await fetchFile("/fonts/Inter.ttf");
        console.log("[Render] Font downloaded, size:", fontData.length);
        await ffmpeg.writeFile("Inter.ttf", fontData);
        console.log("[Render] Font written to FS");
      } catch (err) {
        console.error("[Render] Failed to load local font, trying CDN:", err);
        const fontResp = await fetch(
          "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"
        );
        if (!fontResp.ok) throw new Error("Gagal download font dari CDN");
        const fontBuf = await fontResp.arrayBuffer();
        await ffmpeg.writeFile("Inter.ttf", new Uint8Array(fontBuf));
        console.log("[Render] Font written from CDN");
      }

      setProgress(10);

      // 3. Load background image
      setStage("downloading-audio");
      const bgFile = templateBg[render.template] || templateBg["gradient-dark"];
      try {
        const bgData = await fetchFile(`/templates/${bgFile}`);
        console.log("[Render] Background downloaded, size:", bgData.length);
        await ffmpeg.writeFile("bg.png", bgData);
        console.log("[Render] Background written to FS");
      } catch (err) {
        console.error("[Render] Failed to load background, creating solid fallback:", err);
        const bgColors: Record<string, string> = {
          "gradient-dark": "0x7c3aed",
          neon: "0x0a0a0a",
          minimalist: "0x1a1a2e",
        };
        const color = bgColors[render.template] || "0x7c3aed";
        await ffmpeg.exec([
          "-f", "lavfi", "-i",
          `color=c=${color}:s=1280x720:d=${render.audioDuration || 180}`,
          "-frames:v", "1", "-y", "bg.png",
        ]);
        console.log("[Render] Background created via lavfi");
      }

      setProgress(15);

      // 4. Download audio
      const audioSrc = render.audioKey || render.audioUrl;
      if (!audioSrc) throw new Error("Audio URL tidak ditemukan");

      const audioData = await fetchFile(audioSrc);
      console.log("[Render] Audio downloaded, size:", audioData.length);
      await ffmpeg.writeFile("input.mp3", audioData);
      console.log("[Render] Audio written to FS");

      // 4b. Probe real audio duration → exact output cap (-t).
      // Parse "Duration: HH:MM:SS.xx" from ffmpeg's own header log:
      // version-proof (the ffprobe method is missing in some bundles).
      // Browser duration is an estimate; old wasm ffmpeg -shortest lets
      // ~1.4s of video leak past the audio end.
      let audioDuration = render.audioDuration || 180;
      // object holder: TS doesn't track closure writes via CFA
      const probe: { duration: number | null } = { duration: null };
      const probeListener = ({ message }: { message: string }) => {
        const m = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (m) {
          const secs =
            parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
          if (secs > 1) probe.duration = secs;
        }
      };
      ffmpeg.on("log", probeListener);
      try {
        // No output file → prints header (with Duration) then exits 1.
        await ffmpeg.exec(["-i", "input.mp3"]);
      } catch { /* non-fatal */ }
      ffmpeg.off("log", probeListener);

      const probedDuration = probe.duration;
      if (probedDuration !== null) {
        audioDuration = probedDuration;
        console.log("[Render] Probed audio duration:", probedDuration.toFixed(3), "s");
      } else {
        console.log("[Render] Using browser duration:", audioDuration, "s");
      }

      setProgress(20);

      // 5. Prepare lyrics
      setStage("rendering");
      let lyrics: SyncedLyric[];

      if (render.lyricsSynced) {
        const parsed = JSON.parse(render.lyricsSynced);
        // whisper → bare array; linear → { source: "linear", lines: [...] }
        lyrics = Array.isArray(parsed) ? parsed : parsed.lines ?? [];
        console.log("Using synced lyrics:", lyrics.length, "lines");
        // Log first few for debugging
        lyrics.slice(0, 3).forEach((l, i) =>
          console.log(`  [${i}] "${l.text}" @ ${l.start.toFixed(1)}s-${l.end.toFixed(1)}s (conf: ${l.confidence.toFixed(2)})`)
        );
      } else {
        console.warn("No synced lyrics found, using linear fallback");
        const lines = render.lyrics.split("\n").filter((l) => l.trim());
        const duration = render.audioDuration || 180;
        lyrics = lines.map((line, i) => ({
          text: line,
          start: (i / lines.length) * duration,
          end: ((i + 1) / lines.length) * duration,
          confidence: 0.5,
        }));
      }

      // 6. Build filter complex
      const lyricFileCount = await writeLyricFiles(ffmpeg, lyrics);
      const filterComplex = buildFilterComplex(
        lyrics,
        probedDuration ?? audioDuration + 5
      );

      setProgress(25);

      // 7. Run ffmpeg — improved quality, verify exit code
      const exitCode = await ffmpeg.exec(
        buildExecArgs(filterComplex, probedDuration ?? undefined)
      );

      if (exitCode !== 0) {
        const tail = recentLogs.slice(-5).join(" | ");
        console.error("[Render] ffmpeg exec failed, code:", exitCode, "logs:", tail);
        throw new Error(`ffmpeg gagal encode (code ${exitCode})`);
      }

      setProgress(90);

      // 8. Read output and upload
      setStage("uploading");
      setProgress(92);

      const videoData = await ffmpeg.readFile("output.mp4");
      const videoBytes =
        videoData instanceof Uint8Array
          ? new Uint8Array(videoData)
          : new TextEncoder().encode(videoData as string);
      const arrBuf = new ArrayBuffer(videoBytes.byteLength);
      new Uint8Array(arrBuf).set(videoBytes);
      const videoBlob = new Blob([arrBuf], { type: "video/mp4" });

      console.log("Video size:", (videoBlob.size / 1024 / 1024).toFixed(2), "MB");

      setProgress(95);
      const videoUrl = await uploadVideo(videoBlob, render.id);

      // 9. Cleanup
      try {
        await ffmpeg.deleteFile("input.mp3");
        await ffmpeg.deleteFile("output.mp4");
        await ffmpeg.deleteFile("bg.png");
        await ffmpeg.deleteFile("Inter.ttf");
        for (let i = 0; i < lyricFileCount; i++) {
          await ffmpeg.deleteFile(`lyr${i}.txt`);
        }
      } catch { /* ignore */ }

      setVideoUrl(videoUrl);
      setProgress(100);
      setStage("done");
      await fetchRender();
    } catch (err) {
      console.error("Render error:", err);
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat render";

      try {
        await fetch(`/api/render/status/${render.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "failed", errorMessage }),
        });
      } catch { /* ignore */ }

      setError(errorMessage);
    } finally {
      // Always free WASM memory (~500MB)
      try {
        ffmpegRef.current?.terminate();
      } catch { /* ignore */ }
      ffmpegRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate();
      }
    };
  }, []);

  const getStatusInfo = () => {
    if (stage === "error") {
      return {
        icon: XCircle,
        title: "Render Gagal",
        description: renderError || "Terjadi kesalahan",
        color: "text-red-500",
        bgColor: "bg-red-500/20",
      };
    }

    if (stage === "done" || render?.status === "done") {
      return {
        icon: CheckCircle2,
        title: "Video Siap!",
        description: "Video lirik kamu sudah selesai dibuat",
        color: "text-green-500",
        bgColor: "bg-green-500/20",
      };
    }

    if (stage !== "idle") {
      const stageLabels: Record<string, string> = {
        loading: "Memuat ffmpeg.wasm (~30MB)...",
        "downloading-font": "Menyiapkan font...",
        "downloading-audio": "Download audio & background...",
        rendering: "Merender video...",
        uploading: "Upload video...",
      };
      return {
        icon: Loader2,
        title: stageLabels[stage] || "Memproses...",
        description: "Jangan tutup tab ini selama proses",
        color: "text-primary",
        bgColor: "bg-primary/20",
        spinning: true,
      };
    }

    if (render?.status === "failed") {
      return {
        icon: XCircle,
        title: "Render Gagal",
        description: render.errorMessage || "Terjadi kesalahan",
        color: "text-red-500",
        bgColor: "bg-red-500/20",
      };
    }

    if (render?.status === "pending") {
      return {
        icon: Play,
        title: "Siap untuk Dirender",
        description: "Klik tombol di bawah untuk memulai render video",
        color: "text-primary",
        bgColor: "bg-primary/20",
      };
    }

    if (render?.status === "processing") {
      return {
        icon: Loader2,
        title: "Sedang Diproses...",
        description: "Video sedang dibuat",
        color: "text-primary",
        bgColor: "bg-primary/20",
        spinning: true,
      };
    }

    return {
      icon: Clock,
      title: "Menunggu...",
      description: "",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showProgressBar = stage !== "idle" && stage !== "done" && stage !== "error";
  const showStartButton = render?.status === "pending" && stage === "idle";
  const showRetryButton = stage === "error" || render?.status === "failed";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!render) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Render tidak ditemukan</h2>
          <Link href="/dashboard" className="btn-primary">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const videoSrc = storeVideoUrl || render.videoUrl;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
            {/* Status Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${statusInfo.bgColor}`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color} ${statusInfo.spinning ? "animate-spin" : ""}`} />
              </div>
              <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
              <p className="text-foreground-muted">{statusInfo.description}</p>
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {showProgressBar && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground-muted">Progress</span>
                    <span className="text-foreground-muted">{progress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    />
                  </div>
                  <p className="text-xs text-foreground-muted mt-2 text-center">
                    Estimasi: {Math.max(0, Math.round(((100 - progress) / 100) * (render.audioDuration || 180)))} detik lagi
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WebAssembly Warning */}
            {!canRender && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    Browser kamu tidak mendukung WebAssembly. Gunakan Chrome, Firefox, atau Edge terbaru.
                  </p>
                </div>
              </div>
            )}

            {/* Start Render Warning */}
            {showStartButton && canRender && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    <p className="font-medium mb-1">Sebelum memulai:</p>
                    <ul className="space-y-1 text-yellow-400/80">
                      <li>• Proses ini butuh ~500MB RAM</li>
                      <li>• Estimasi waktu: 2-5 menit (tergantung durasi audio)</li>
                      <li>• Jangan tutup tab selama proses</li>
                      <li>• Hasil video: 1280x720, MP4</li>
                      <li>• Lirik telah disinkronkan dengan audio (Whisper AI)</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Video Preview */}
            {(stage === "done" || render.status === "done") && videoSrc && (
              <div className="mb-8">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <video controls className="w-full h-full" src={videoSrc}>
                    Browser kamu tidak mendukung video player.
                  </video>
                </div>
              </div>
            )}

            {/* Video Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Template</span>
                <span className="text-sm font-medium capitalize">{render.template.replace("-", " ")}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Durasi Audio</span>
                <span className="text-sm font-medium">{formatDuration(render.audioDuration)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Baris Lirik</span>
                <span className="text-sm font-medium">{render.lyrics.split("\n").filter((l) => l.trim()).length} baris</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Sync Status</span>
                <span className="text-sm font-medium">
                  {(() => {
                    if (!render.lyricsSynced) {
                      return <span className="text-yellow-400">⚠ Linear fallback</span>;
                    }
                    try {
                      const parsed = JSON.parse(render.lyricsSynced);
                      if (!Array.isArray(parsed) && parsed?.source === "linear") {
                        return <span className="text-yellow-400">⚠ Linear (manual timing)</span>;
                      }
                      return <span className="text-green-400">✓ Whisper AI synced</span>;
                    } catch {
                      return <span className="text-yellow-400">⚠ Linear fallback</span>;
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Poin Digunakan</span>
                <span className="text-sm font-medium">{render.pointsCost} poin</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Dibuat</span>
                <span className="text-sm font-medium">
                  {new Date(render.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              {render.completedAt && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground-muted">Selesai</span>
                  <span className="text-sm font-medium">
                    {new Date(render.completedAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {showStartButton && (
                <button onClick={startRender} disabled={!canRender} className="w-full btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Play className="w-5 h-5" />
                  Mulai Render
                </button>
              )}

              {(stage === "done" || render.status === "done") && videoSrc && (
                <a href={videoSrc} download={`lyric-video-${render.id}.mp4`} className="w-full btn-primary flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Video MP4
                </a>
              )}

              {showRetryButton && (
                <button onClick={() => { reset(); setRender({ ...render, status: "pending" }); }} className="w-full btn-primary flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Coba Lagi
                </button>
              )}

              <Link href="/create" className="w-full btn-secondary flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                Buat Video Baru
              </Link>
            </div>
          </motion.div>

          {showStartButton && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 card p-6">
              <h3 className="font-semibold mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>• Video dirender di browser kamu (bukan server)</li>
                <li>• Gunakan Chrome/Firefox untuk hasil terbaik</li>
                <li>• Jangan buka tab lain yang berat selama proses</li>
                <li>• Kalau proses lambat, coba tutup aplikasi lain</li>
              </ul>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
