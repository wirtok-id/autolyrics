"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Music, Plus, Clock, Video, ArrowRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";

// Mock data for development
const mockUser = {
  name: "Budi",
  email: "budi@example.com",
  tier: "free" as const,
  points: 7,
  pointsResetAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
};

const mockRenders = [
  {
    id: "1",
    title: "Lagu Kenangan",
    template: "gradient-dark",
    status: "done" as const,
    pointsCost: 1,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Cinta Sejati",
    template: "gradient-dark",
    status: "processing" as const,
    pointsCost: 1,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "3",
    title: "Malam Hari",
    template: "gradient-dark",
    status: "failed" as const,
    pointsCost: 1,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

function getTimeUntilReset(resetAt: Date) {
  const now = new Date();
  const diff = resetAt.getTime() - now.getTime();
  
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

export default function DashboardPage() {
  const [user] = useState(mockUser);
  const [renders] = useState(mockRenders);

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
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-foreground-muted uppercase tracking-wider">
                  {user.tier}
                </span>
              </div>
              <div className="text-4xl font-bold gradient-text mb-1">{user.points}</div>
              <div className="text-sm text-foreground-muted">Poin tersisa</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-3 h-3" />
                Reset dalam {getTimeUntilReset(user.pointsResetAt)}
              </div>
            </div>

            {/* Total Renders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{renders.length}</div>
              <div className="text-sm text-foreground-muted">Total render</div>
            </div>

            {/* Success Rate */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-pink-500/20 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {renders.filter((r) => r.status === "done").length}
              </div>
              <div className="text-sm text-foreground-muted">Video selesai</div>
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
                      <h3 className="font-semibold truncate">{render.title}</h3>
                      <p className="text-sm text-foreground-muted">
                        {render.pointsCost} poin • {render.createdAt.toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    
                    {/* Status */}
                    <div className="flex-shrink-0">
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
