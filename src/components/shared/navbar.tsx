"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Music, Menu, X, LogOut, User, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "@/lib/auth/client";

export function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const user = session?.user;

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
          <Link href="/#features" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Fitur
          </Link>
          <Link href="/#how-it-works" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            Cara Kerja
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {isPending ? (
            <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Mulai Gratis
              </Link>
            </>
          )}
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-6 py-4 space-y-4">
              <Link
                href="/#features"
                className="block text-sm text-foreground-muted hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fitur
              </Link>
              <Link
                href="/#how-it-works"
                className="block text-sm text-foreground-muted hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cara Kerja
              </Link>
              
              <div className="pt-4 border-t border-white/5 space-y-3">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block text-sm text-foreground-muted hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block text-sm text-foreground-muted hover:text-foreground"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-sm text-foreground-muted hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-sm text-center block"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mulai Gratis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
