import { Music } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background-secondary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">AutoLyrics</span>
            </Link>
            <p className="text-sm text-foreground-muted max-w-sm">
              Buat video lirik lagu otomatis dengan mudah. Upload audio + lirik, dapatkan video MP4 siap share ke teman dan keluarga.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Harga
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Mulai Gratis
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground-muted">
            © 2026 AutoLyrics. All rights reserved.
          </p>
          <p className="text-sm text-foreground-muted">
            Made with ❤️ for music lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
