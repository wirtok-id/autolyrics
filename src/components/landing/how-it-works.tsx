"use client";

import { motion } from "framer-motion";
import { Upload, Music, Wand2, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Audio",
    description: "Upload file lagu favorit kamu (MP3, WAV, M4A). Maks 5 menit.",
  },
  {
    number: "02",
    icon: Music,
    title: "Tambah Lirik",
    description: "Tempel lirik lagu di textarea. Bisa dari genius.com atau tempat lain.",
  },
  {
    number: "03",
    icon: Wand2,
    title: "Pilih Template",
    description: "Pilih gaya video: gradient, neon, atau minimalist. Sesuai selera.",
  },
  {
    number: "04",
    icon: Download,
    title: "Download Video",
    description: "Tunggu beberapa detik, video lirik MP4 siap di-download dan share.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative bg-background-secondary">
      <div className="absolute inset-0 dot-grid opacity-30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cara <span className="gradient-text">Kerja</span>
          </h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            4 langkah simpel untuk bikin video lirik. Tanpa skill editing, tanpa aplikasi rumit.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="card p-6 text-center relative z-10">
                {/* Step Number */}
                <div className="text-5xl font-bold gradient-text opacity-20 mb-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-foreground-muted">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
