"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { 
  Video, Download, Loader2, CheckCircle2, XCircle, 
  ArrowLeft, Music, Clock, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

type RenderStatus = "pending" | "processing" | "done" | "failed";

interface RenderData {
  id: string;
  lyrics: string;
  template: string;
  status: RenderStatus;
  pointsCost: number;
  videoUrl: string | null;
  audioDuration: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const renderId = params.id as string;
  
  const [render, setRender] = useState<RenderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const fetchRender = useCallback(async () => {
    try {
      const response = await fetch(`/api/render/status/${renderId}`);
      if (response.ok) {
        const data = await response.json();
        setRender(data);
        return data.status;
      }
    } catch (err) {
      console.error("Failed to fetch render:", err);
    }
    return null;
  }, [renderId]);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchRender();
      setIsLoading(false);
    };
    load();
  }, [fetchRender]);

  // Polling for status updates
  useEffect(() => {
    if (!render) return;
    if (render.status === "done" || render.status === "failed") return;

    const interval = setInterval(async () => {
      const status = await fetchRender();
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [render?.status, fetchRender]);

  // Update progress when status changes
  useEffect(() => {
    if (render?.status === "done") {
      setProgress(100);
    }
  }, [render?.status]);

  const getStatusInfo = () => {
    switch (render?.status) {
      case "done":
        return {
          icon: CheckCircle2,
          title: "Video Siap!",
          description: "Video lirik kamu sudah selesai dibuat",
          color: "text-green-500",
          bgColor: "bg-green-500/20",
        };
      case "processing":
        return {
          icon: Loader2,
          title: "Sedang Diproses...",
          description: "Video sedang dibuat. Tunggu sebentar.",
          color: "text-primary",
          bgColor: "bg-primary/20",
        };
      case "failed":
        return {
          icon: XCircle,
          title: "Gagal",
          description: render?.errorMessage || "Terjadi kesalahan saat membuat video",
          color: "text-red-500",
          bgColor: "bg-red-500/20",
        };
      default:
        return {
          icon: Clock,
          title: "Menunggu...",
          description: "Video dalam antrian",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/20",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
          <Link href="/dashboard" className="btn-primary">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            {/* Status Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${statusInfo.bgColor}`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color} ${
                  render.status === "processing" || render.status === "pending" ? "animate-spin" : ""
                }`} />
              </div>
              <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
              <p className="text-foreground-muted">{statusInfo.description}</p>
            </div>

            {/* Progress Bar (for pending/processing) */}
            {(render.status === "pending" || render.status === "processing") && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-foreground-muted">Progress</span>
                  <span className="text-foreground-muted">{Math.min(Math.round(progress), 100)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  />
                </div>
                <p className="text-xs text-foreground-muted mt-2 text-center">
                  {render.status === "pending" 
                    ? "Menunggu antrian..." 
                    : `Estimasi: ${Math.max(0, Math.round((100 - progress) / 10))} detik lagi`
                  }
                </p>
              </div>
            )}

            {/* Video Preview (for done) */}
            {render.status === "done" && render.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full h-full"
                    src={render.videoUrl}
                  >
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
                <span className="text-sm font-medium">{render.lyrics.split("\n").filter(l => l.trim()).length} baris</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Poin Digunakan</span>
                <span className="text-sm font-medium">{render.pointsCost} poin</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Dibuat</span>
                <span className="text-sm font-medium">
                  {new Date(render.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {render.completedAt && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground-muted">Selesai</span>
                  <span className="text-sm font-medium">
                    {new Date(render.completedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {render.status === "done" && render.videoUrl && (
                <a
                  href={render.videoUrl}
                  download
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Video MP4
                </a>
              )}
              
              {render.status === "failed" && (
                <Link
                  href="/create"
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Coba Lagi
                </Link>
              )}

              <Link
                href="/create"
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Music className="w-5 h-5" />
                Buat Video Baru
              </Link>
            </div>
          </motion.div>

          {/* Tips */}
          {(render.status === "pending" || render.status === "processing") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 card p-6"
            >
              <h3 className="font-semibold mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>• Video biasanya selesai dalam 30-60 detik</li>
                <li>• Jangan tutup halaman ini selama proses</li>
                <li>• Kamu bisa kembali ke dashboard dan cek status di sana</li>
              </ul>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
