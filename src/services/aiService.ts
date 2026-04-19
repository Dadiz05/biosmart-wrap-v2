import type { AIResult } from "../types";

export const analyzeColor = async (): Promise<AIResult> => {
  // 👉 test theo QR

  // Lấy QR vừa scan (lưu tạm trong localStorage)
  const lastQR = localStorage.getItem("lastQR");

  // 🟢 CASE 1: QR = "123" → TƯƠI
  if (lastQR === "123") {
    return {
      ph: 5.5,
      color: "purple",
      status: "fresh",
    };
  }

  // 🔴 CASE 2: QR = "456" → NGUY HIỂM
  if (lastQR === "456") {
    return {
      ph: 9.5,
      color: "green",
      status: "spoiled",
    };
  }

  // fallback random
  return {
    ph: 7,
    color: "blue",
    status: "warning",
  };
};