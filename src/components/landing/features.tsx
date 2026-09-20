"use client";

import { Upload, Wand2, Download, Zap, Music, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Upload,
    title: "Upload Audio",
    description: "Drag & drop file audio MP3, WAV, atau M4A. Maksimal 5 menit durasi.",
    color: "from-primary to-primary-dark",
  },
  {
    icon: Music,
    title: "Paste Lirik",
    description: "Tempel lirik lagu kamu. Sistem akan otomatis sinkronkan dengan audio.",
    color: "from-secondary to-blue-600",
  },
  {
    icon: Wand2,
    title: "Pilih Template",
    description: "Pilih gaya visual yang kamu suka. Gradient, neon, atau minimalist.",
    color: "from-accent to-pink-600",
  },
  {
    icon: Zap,
    title: "Render Cepat",
    description: "Video jadi dalam hitungan detik. Ga perlu nunggu lama.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Download,
    title: "Download MP4",
    description: "Langsung download video berkualitas HD. Siap share ke mana aja.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "Gratis Selamanya",
    description: "10 poin gratis setiap minggu. Cukup buat video lirik pribadi.",
    color: "from-purple-500 to-indigo-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fitur <span className="gradient-text">Unggulan</span>
          </h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Semua yang kamu butuhkan untuk bikin video lirik keren, ada di sini.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card p-6 group hover:glow-sm"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
