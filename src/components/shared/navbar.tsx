"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Music, Menu, X } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">AutoLyrics</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Fitur
          </Link>
          <Link href="#how-it-works" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Cara Kerja
          </Link>
          <Link href="#pricing" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Harga
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Masuk
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground-muted"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-white/5">
          <div className="px-6 py-4 space-y-4">
            <Link href="#features" className="block text-sm text-foreground-muted hover:text-foreground">
              Fitur
            </Link>
            <Link href="#how-it-works" className="block text-sm text-foreground-muted hover:text-foreground">
              Cara Kerja
            </Link>
            <Link href="#pricing" className="block text-sm text-foreground-muted hover:text-foreground">
              Harga
            </Link>
            <div className="pt-4 border-t border-white/5 space-y-3">
              <Link href="/login" className="block text-sm text-foreground-muted hover:text-foreground">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary text-sm text-center block">
                Mulai Gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
