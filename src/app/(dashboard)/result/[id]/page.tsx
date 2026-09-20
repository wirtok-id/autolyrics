"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { 
  Video, Download, Loader2, CheckCircle2, XCircle, 
  ArrowLeft, Music, Clock, Copy, ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock data for development
type RenderStatus = "pending" | "processing" | "done" | "failed";

interface MockRender {
  id: string;
  title: string;
  template: string;
  status: RenderStatus;
  pointsCost: number;
  lyrics: string;
  createdAt: Date;
  progress: number;
}

const mockRender: MockRender = {
  id: "mock-id",
  title: "Lagu Kenangan",
  template: "gradient-dark",
  status: "processing",
  pointsCost: 1,
  lyrics: "Ku tak bisa hidup tanpa dirimu\nEngkau selalu ada di pikiranku\nSetiap malam ku termimpikan dirimu\nHanya kamu yang ku inginkan",
  createdAt: new Date(),
  progress: 65,
};

export default function ResultPage() {
  const params = useParams();
  const [render, setRender] = useState<MockRender>(mockRender);
  const [progress, setProgress] = useState(0);

  // Simulate progress polling
  useEffect(() => {
    if (render.status !== "processing") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate completion
          setTimeout(() => {
            setRender({ ...render, status: "done" });
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [render.status]);

  const getStatusInfo = () => {
    switch (render.status) {
      case "done":
        return {
          icon: CheckCircle2,
          title: "Video Siap!",
          description: "Video lirik kamu sudah selesai dibuat",
          color: "text-green-500",
        };
      case "processing":
        return {
          icon: Loader2,
          title: "Sedang Diproses...",
          description: "Video sedang dibuat. Tunggu sebentar.",
          color: "text-primary",
        };
      case "failed":
        return {
          icon: XCircle,
          title: "Gagal",
          description: "Terjadi kesalahan saat membuat video",
          color: "text-red-500",
        };
      default:
        return {
          icon: Clock,
          title: "Menunggu...",
          description: "Video dalam antrian",
          color: "text-yellow-500",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

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
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                render.status === "done"
                  ? "bg-green-500/20"
                  : render.status === "processing"
                  ? "bg-primary/20"
                  : render.status === "failed"
                  ? "bg-red-500/20"
                  : "bg-yellow-500/20"
              }`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color} ${
                  render.status === "processing" ? "animate-spin" : ""
                }`} />
              </div>
              <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
              <p className="text-foreground-muted">{statusInfo.description}</p>
            </div>

            {/* Progress Bar (for processing) */}
            {render.status === "processing" && (
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
                  Estimasi: {Math.max(0, Math.round((100 - progress) / 10))} detik lagi
                </p>
              </div>
            )}

            {/* Video Preview (for done) */}
            {render.status === "done" && (
              <div className="mb-8">
                <div className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* Mock video preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Music className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60 text-sm">Preview Video</p>
                    </div>
                  </div>
                  
                  {/* Lyrics overlay mock */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-white text-center text-lg font-medium">
                        {render.lyrics.split("\n")[0]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Judul</span>
                <span className="text-sm font-medium">{render.title}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Template</span>
                <span className="text-sm font-medium capitalize">{render.template}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-foreground-muted">Poin Digunakan</span>
                <span className="text-sm font-medium">{render.pointsCost} poin</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground-muted">Dibuat</span>
                <span className="text-sm font-medium">
                  {render.createdAt.toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {render.status === "done" && (
                <button className="w-full btn-primary flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Video MP4
                </button>
              )}
              
              {render.status === "failed" && (
                <button className="w-full btn-primary flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Coba Lagi
                </button>
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
          {render.status === "processing" && (
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
