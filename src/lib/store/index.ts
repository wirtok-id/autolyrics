import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  tier: "free" | "friend" | "family";
  points: number;
  pointsResetAt: Date;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Render state
  currentRenderId: string | null;
  setCurrentRenderId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  currentRenderId: null,
  setCurrentRenderId: (id) => set({ currentRenderId: id }),
}));
