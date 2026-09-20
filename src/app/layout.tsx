import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoLyrics - Video Lirik Otomatis",
  description: "Buat video lirik lagu otomatis dengan AI. Upload audio + lirik, dapatkan video MP4 siap share.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
