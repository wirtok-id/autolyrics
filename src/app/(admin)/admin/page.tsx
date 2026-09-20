"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { 
  Users, Video, Settings, Shield, Loader2, 
  ChevronLeft, Edit2, Check, X, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth/client";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  points: number;
  createdAt: string;
}

interface RenderData {
  id: string;
  userId: string;
  userName: string;
  status: string;
  template: string;
  audioDuration: number | null;
  pointsCost: number;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalRenders: number;
  rendersThisMonth: number;
  completedRenders: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [renders, setRenders] = useState<RenderData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ tier: string; points: number; role: string }>({
    tier: "free",
    points: 10,
    role: "user",
  });

  useEffect(() => {
    if (!isPending && session?.user) {
      if ((session.user as any).role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchAdminData();
    }
  }, [session, isPending, router]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch("/api/admin");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setRenders(data.renders || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tier: editValues.tier,
          points: editValues.points,
          role: editValues.role,
        }),
      });

      if (response.ok) {
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || (session.user as any).role !== "admin") {
    return null;
  }

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
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Admin Panel
            </h1>
          </motion.div>

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-foreground-muted">Total User</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRenders}</p>
                    <p className="text-xs text-foreground-muted">Total Render</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.rendersThisMonth}</p>
                    <p className="text-xs text-foreground-muted">Render Bulan Ini</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.completedRenders}</p>
                    <p className="text-xs text-foreground-muted">Selesai</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users.length})
            </h2>
            
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Nama</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Tier</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Poin</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Role</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">{user.name}</td>
                        <td className="p-4 text-foreground-muted">{user.email}</td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <select
                              value={editValues.tier}
                              onChange={(e) => setEditValues({ ...editValues, tier: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                            >
                              <option value="free">Free</option>
                              <option value="friend">Friend</option>
                              <option value="family">Family</option>
                            </select>
                          ) : (
                            <span className="capitalize">{user.tier}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <input
                              type="number"
                              value={editValues.points}
                              onChange={(e) => setEditValues({ ...editValues, points: parseInt(e.target.value) || 0 })}
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm w-20"
                            />
                          ) : (
                            user.points
                          )}
                        </td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <select
                              value={editValues.role}
                              onChange={(e) => setEditValues({ ...editValues, role: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="capitalize">{user.role}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateUser(user.id)}
                                className="p-1 rounded bg-green-500/20 text-green-400"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="p-1 rounded bg-red-500/20 text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditValues({ tier: user.tier, points: user.points, role: user.role });
                              }}
                              className="p-1 rounded hover:bg-white/10"
                            >
                              <Edit2 className="w-4 h-4 text-foreground-muted" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Renders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Recent Renders ({renders.length})
            </h2>
            
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">User</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Template</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Durasi</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Poin</th>
                      <th className="text-left p-4 text-sm font-medium text-foreground-muted">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renders.map((render) => (
                      <tr key={render.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">{render.userName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            render.status === "done" ? "bg-green-500/20 text-green-400" :
                            render.status === "processing" ? "bg-yellow-500/20 text-yellow-400" :
                            render.status === "failed" ? "bg-red-500/20 text-red-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {render.status}
                          </span>
                        </td>
                        <td className="p-4 capitalize">{render.template.replace("-", " ")}</td>
                        <td className="p-4">
                          {render.audioDuration 
                            ? `${Math.floor(render.audioDuration / 60)}:${(render.audioDuration % 60).toString().padStart(2, "0")}`
                            : "-"
                          }
                        </td>
                        <td className="p-4">{render.pointsCost}</td>
                        <td className="p-4 text-foreground-muted">
                          {new Date(render.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
