import { create } from "zustand";
import type { Product, AIResult, AppStatus } from "../types";

type State = {
  product: Product | null;
  aiResult: AIResult | null;
  status: AppStatus;

  setProduct: (p: Product) => void;
  setAI: (a: AIResult) => void;
  setStatus: (s: AppStatus) => void;
};

export const useStore = create<State>((set) => ({
  product: null,
  aiResult: null,
  status: "idle",

  setProduct: (p) => set({ product: p }),
  setAI: (a) => set({ aiResult: a }),
  setStatus: (s) => set({ status: s }),
}));