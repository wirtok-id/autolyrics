import { create } from "zustand";

export type RenderStage =
  | "idle"
  | "loading"
  | "downloading-audio"
  | "downloading-font"
  | "rendering"
  | "uploading"
  | "done"
  | "error";

interface RenderState {
  stage: RenderStage;
  progress: number; // 0-100
  error: string | null;
  videoUrl: string | null;

  setStage: (stage: RenderStage) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setVideoUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState = {
  stage: "idle" as RenderStage,
  progress: 0,
  error: null,
  videoUrl: null,
};

export const useRenderStore = create<RenderState>((set) => ({
  ...initialState,

  setStage: (stage) => set({ stage }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, stage: "error" }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  reset: () => set(initialState),
}));
