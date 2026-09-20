"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 dot-grid opacity-50" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-foreground-muted">Free untuk semua orang</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          Buat Video Lirik{" "}
          <span className="gradient-text">Otomatis</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto mb-10"
        >
          Upload audio lagu favoritmu, paste liriknya, dan biarkan sistem bikin video lirik yang keren. 
          Tanpa ribet, tanpa skill editing.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/register" className="btn-primary text-base flex items-center justify-center gap-2">
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            Lihat Cara Kerja
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
        >
          <div>
            <div className="text-2xl font-bold gradient-text">100%</div>
            <div className="text-sm text-foreground-muted">Gratis</div>
          </div>
          <div>
            <div className="text-2xl font-bold gradient-text">30detik</div>
            <div className="text-sm text-foreground-muted">Waktu Render</div>
          </div>
          <div>
            <div className="text-2xl font-bold gradient-text">HD</div>
            <div className="text-sm text-foreground-muted">Kualitas Video</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
