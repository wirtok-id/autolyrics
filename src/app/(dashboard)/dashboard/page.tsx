"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Plus, Music, Clock, Video, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth/client";

interface Render {
  id: string;
  lyrics: string;
  template: string;
  status: string;
  pointsCost: number;
  videoUrl: string | null;
  createdAt: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tier: string;
    points: number;
    pointsResetAt: string | null;
  };
  renders: Render[];
  totalRenders: number;
  completedRenders: number;
}

function getTimeUntilReset(resetAt: string | null): string {
  if (!resetAt) return "Belum diatur";
  
  const now = new Date();
  const reset = new Date(resetAt);
  const diff = reset.getTime() - now.getTime();
  
  if (diff <= 0) return "Reset sekarang";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "done":
      return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Selesai</span>;
    case "processing":
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Proses</span>;
    case "pending":
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">Antri</span>;
    case "failed":
      return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">Gagal</span>;
    default:
      return null;
  }
}

function getTemplateBadge(template: string) {
  switch (template) {
    case "gradient-dark":
      return <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">Gradient</span>;
    case "neon":
      return <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">Neon</span>;
    case "minimalist":
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">Minimal</span>;
    default:
      return null;
  }
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && session?.user) {
      fetchDashboardData();
    }
  }, [session, isPending]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground-muted">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  const user = dashboardData?.user || session.user as any;
  const renders = dashboardData?.renders || [];
  const points = user.points || 0;
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              Halo, <span className="gradient-text">{user.name}</span> 👋
            </h1>
            <p className="text-foreground-muted">
              Selamat datang di dashboard AutoLyrics
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Points Card */}
            <div className={`card p-6 ${points === 0 ? 'border-red-500/30' : points < 3 ? 'border-yellow-500/30' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-foreground-muted uppercase tracking-wider">
                  {user.tier}
                </span>
              </div>
              <div className={`text-4xl font-bold mb-1 ${points === 0 ? 'text-red-400' : points < 3 ? 'text-yellow-400' : 'gradient-text'}`}>
                {points}
              </div>
              <div className="text-sm text-foreground-muted">Poin tersisa</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-3 h-3" />
                Reset dalam {getTimeUntilReset(user.pointsResetAt)}
              </div>
              
              {points === 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Poin habis. Reset mingguan.
                  </div>
                </div>
              )}
              
              {points > 0 && points < 3 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    Poin tinggal sedikit!
                  </div>
                </div>
              )}
            </div>

            {/* Total Renders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{dashboardData?.totalRenders || 0}</div>
              <div className="text-sm text-foreground-muted">Total render</div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="text-green-400">{dashboardData?.completedRenders || 0} selesai</span>
              </div>
            </div>

            {/* Account Info */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-pink-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="text-lg font-semibold mb-1">{user.email}</div>
              <div className="text-sm text-foreground-muted capitalize">{user.role} • {user.tier} tier</div>
            </div>
          </motion.div>

          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link
              href="/create"
              className="btn-primary text-base flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Buat Video Baru
            </Link>
          </motion.div>

          {/* Render History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4">Riwayat Render</h2>
            
            {renders.length === 0 ? (
              <div className="card p-12 text-center">
                <Video className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum ada render</h3>
                <p className="text-sm text-foreground-muted mb-4">
                  Mulai buat video lirik pertama kamu
                </p>
                <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Buat Sekarang
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {renders.map((render) => (
                  <Link
                    key={render.id}
                    href={`/result/${render.id}`}
                    className="card p-4 flex items-center gap-4 hover:border-white/20 transition-all block"
                  >
                    {/* Thumbnail Placeholder */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {render.lyrics?.split("\n")[0] || "Video Lirik"}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {render.pointsCost} poin • {new Date(render.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {getTemplateBadge(render.template)}
                      {getStatusBadge(render.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
