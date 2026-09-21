"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { 
  Upload, Music, FileAudio, X, Wand2, ArrowRight, 
  Loader2, AlertCircle, Check, Mic, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth/client";

const templates = [
  {
    id: "gradient-dark",
    name: "Gradient Dark",
    description: "Background gradient ungu-biru yang elegan",
    preview: "bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700",
    available: true,
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Efek neon menyala di gelap",
    preview: "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600",
    available: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Bersih dan simpel",
    preview: "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900",
    available: false,
  },
];

const acceptedFormats = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"];
const maxFileSize = 10 * 1024 * 1024; // 10MB
const maxDuration = 300; // 5 minutes in seconds

export default function CreatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("gradient-dark");
  const [autoSync, setAutoSync] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = useCallback((file: File) => {
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
    
    // Get audio duration
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      if (audio.duration > maxDuration) {
        setError("Durasi audio terlalu panjang. Maksimal 5 menit.");
        setAudioFile(null);
        return;
      }
      setAudioDuration(audio.duration);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeAudio = useCallback(() => {
    setAudioFile(null);
    setAudioDuration(null);
  }, []);

  const lyricsLineCount = lyrics.split("\n").filter((line) => line.trim()).length;
  const canSubmit = audioFile && lyrics.trim() && lyricsLineCount >= 4 && !isUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsUploading(true);
    setError("");

    try {
      // 1. Get presigned URL
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: audioFile!.name,
          fileType: audioFile!.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error("Gagal mendapatkan upload URL");
      }

      const { uploadUrl, key } = await presignResponse.json();

      // 2. Upload audio using FormData
      const formData = new FormData();
      formData.append("file", audioFile!);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal upload audio");
      }

      const { publicUrl } = await uploadResponse.json();

      // 3. Create render job
      const renderResponse = await fetch("/api/render/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioKey: publicUrl,
          audioDuration: audioDuration,
          lyrics: lyrics,
          template: selectedTemplate,
          autoSync: autoSync,
        }),
      });

      if (!renderResponse.ok) {
        const data = await renderResponse.json();
        throw new Error(data.error || "Gagal membuat render");
      }

      const { renderId } = await renderResponse.json();
      router.push(`/result/${renderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
                <div className="card p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <FileAudio className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{audioFile.name}</p>
                      <p className="text-sm text-foreground-muted">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        {audioDuration && ` • ${formatDuration(audioDuration)}`}
                      </p>
                    </div>
                    <button
                      onClick={removeAudio}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground-muted" />
                    </button>
                  </div>
                  
                  {/* Audio Player */}
                  <audio
                    ref={audioRef}
                    controls
                    src={URL.createObjectURL(audioFile)}
                    className="w-full mt-4 h-8"
                  />
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
                  rows={10}
                />
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={`text-sm ${lyricsLineCount < 4 ? 'text-yellow-400' : 'text-foreground-muted'}`}>
                    {lyricsLineCount} baris lirik {lyricsLineCount < 4 && '(minimal 4 baris)'}
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
                    onClick={() => template.available && setSelectedTemplate(template.id)}
                    disabled={!template.available}
                    className={`card p-4 text-left transition-all ${
                      selectedTemplate === template.id
                        ? "border-primary/50 bg-primary/5"
                        : !template.available
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-white/20"
                    }`}
                  >
                    {/* Preview */}
                    <div className={`w-full h-20 rounded-lg ${template.preview} mb-3 flex items-center justify-center`}>
                      <span className="text-white/80 text-sm font-medium">
                        {template.available ? "Lirik di sini..." : "Coming Soon"}
                      </span>
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

            {/* Step 4: Auto-Sync Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                  4
                </span>
                Sinkronisasi Lirik
              </h2>
              
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Auto-sync pakai AI</p>
                      <p className="text-sm text-foreground-muted">
                        Groq Whisper akan sinkronkan lirik otomatis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoSync(!autoSync)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoSync ? 'bg-primary' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoSync ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                {autoSync && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary">
                      ✨ Lirik akan disinkronkan otomatis. Estimasi: ~30 detik.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Summary */}
              {audioFile && lyrics && (
                <div className="card p-4 mb-4">
                  <h3 className="font-medium mb-3">Ringkasan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Audio:</span>
                      <span>{audioFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Durasi:</span>
                      <span>{audioDuration ? formatDuration(audioDuration) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Lirik:</span>
                      <span>{lyricsLineCount} baris</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Template:</span>
                      <span className="capitalize">{selectedTemplate.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Auto-sync:</span>
                      <span>{autoSync ? 'Ya' : 'Tidak'}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-white/5">
                      <span>Poin:</span>
                      <span className="gradient-text">1 poin</span>
                    </div>
                  </div>
                </div>
              )}

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
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
