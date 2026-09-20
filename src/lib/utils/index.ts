import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Generate unique ID
export function createId(): string {
  return crypto.randomUUID();
}

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to Indonesian locale
export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format date with time
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format duration (seconds to mm:ss)
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Get next Monday 00:00 WIB (UTC+7)
export function getNextMondayReset(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(17, 0, 0, 0); // 00:00 WIB = 17:00 UTC previous day
  
  return nextMonday;
}

// Get time remaining until reset
export function getTimeUntilReset(): { days: number; hours: number; minutes: number; seconds: number } {
  const resetTime = getNextMondayReset();
  const now = new Date();
  const diff = resetTime.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

// Calculate points cost based on audio duration
export function calculatePointsCost(durationSeconds: number): number {
  if (durationSeconds <= 180) {
    // < 3 minutes = 1 point
    return 1;
  } else if (durationSeconds <= 300) {
    // 3-5 minutes = 2 points
    return 2;
  }
  // Should not happen as we enforce max 5 minutes
  return 2;
}

// Get max points for tier
export function getMaxPoints(tier: "free" | "friend" | "family"): number {
  switch (tier) {
    case "free":
      return 10;
    case "friend":
      return 15;
    case "family":
      return 30;
    default:
      return 10;
  }
}

// Cooldown: 1 render per 5 minutes
export const COOLDOWN_MS = 5 * 60 * 1000;
