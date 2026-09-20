"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/shared/navbar";
import { 
  Upload, Music, FileAudio, X, Wand2, ArrowRight, 
  Loader2, AlertCircle, Check
} from "lucide-react";
import { motion } from "framer-motion";

const templates = [
  {
    id: "gradient-dark",
    name: "Gradient Dark",
    description: "Background gradient ungu-biru yang elegan",
    gradient: "from-purple-600 via-blue-600 to-indigo-700",
    preview: "bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700",
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Efek neon menyala di gelap",
    gradient: "from-cyan-500 via-blue-500 to-purple-600",
    preview: "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600",
    disabled: true,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Bersih dan simpel",
    gradient: "from-gray-700 via-gray-800 to-gray-900",
    preview: "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900",
    disabled: true,
  },
];

export default function CreatePage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("gradient-dark");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    setError("");
    
    if (!acceptedFormats.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan MP3, WAV, atau M4A.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeAudio = () => {
    setAudioFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudioPreview(null);
  };

  const lyricsLineCount = lyrics.split("\n").filter((line) => line.trim()).length;

  const canSubmit = audioFile && lyrics.trim() && !isUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsUploading(true);
    setError("");

    // TODO: Implement actual submission
    // 1. Upload audio to R2 (or local storage for now)
    // 2. Create render job
    // 3. Redirect to result page
    
    setTimeout(() => {
      window.location.href = "/result/mock-id";
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              Buat Video <span className="gradient-text">Lirik Baru</span>
            </h1>
            <p className="text-foreground-muted">
              Upload audio dan lirik, pilih template, lalu generate video kamu
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-8">
            {/* Step 1: Upload Audio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                  1
                </span>
                Upload Audio
              </h2>
              
              {audioFile ? (
                <div className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <FileAudio className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{audioFile.name}</p>
                    <p className="text-sm text-foreground-muted">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {audioPreview && (
                    <audio controls src={audioPreview} className="h-8" />
                  )}
                  <button
                    onClick={removeAudio}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground-muted" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`card p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary/50 bg-primary/5"
                      : "hover:border-white/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${
                    isDragging ? "text-primary" : "text-foreground-muted"
                  }`} />
                  <p className="font-medium mb-2">
                    {isDragging ? "Lepaskan file di sini" : "Drag & drop file audio"}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    atau klik untuk memilih file
                  </p>
                  <p className="text-xs text-foreground-muted mt-4">
                    MP3, WAV, M4A • Maksimal 10MB • Maksimal 5 menit
                  </p>
                </div>
              )}
            </motion.div>

            {/* Step 2: Input Lyrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                  2
                </span>
                Tulis Lirik
              </h2>
              
              <div className="card p-4">
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder={"Tempel lirik lagu di sini...\n\nContoh:\nKu tak bisa hidup tanpa dirimu\nEngkau selalu ada di pikiranku\nSetiap malam ku termimpikan dirimu\nHanya kamu yang ku inginkan"}
                  className="w-full h-48 bg-transparent resize-none focus:outline-none text-foreground placeholder-foreground-muted"
                />
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-sm text-foreground-muted">
                    {lyricsLineCount} baris lirik
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {lyrics.length} karakter
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Choose Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                  3
                </span>
                Pilih Template
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => !template.disabled && setSelectedTemplate(template.id)}
                    disabled={template.disabled}
                    className={`card p-4 text-left transition-all ${
                      selectedTemplate === template.id
                        ? "border-primary/50 bg-primary/5"
                        : template.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-white/20"
                    }`}
                  >
                    {/* Preview */}
                    <div className={`w-full h-20 rounded-lg ${template.preview} mb-3`}>
                      <div className="w-full h-full flex items-center justify-center text-white/80 text-sm font-medium">
                        {template.name === "Gradient Dark" && "Lirik di sini..."}
                        {template.name === "Neon Glow" && "Coming Soon"}
                        {template.name === "Minimalist" && "Coming Soon"}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-foreground-muted">{template.description}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Video
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-sm text-foreground-muted mt-3">
                1 poin akan dikurangkan dari akun kamu
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
