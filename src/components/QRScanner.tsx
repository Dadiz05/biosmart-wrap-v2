import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { getProduct } from "../services/api";
import { analyzeColor } from "../services/aiService";
import { useStore } from "../store/useStore";

export default function QRScanner() {
  const { setProduct, setAI, setStatus, product, aiResult } = useStore();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<"fresh" | "danger" | null>(null);
  const [scanTimeout, setScanTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 🚀 START SCAN
  const startScan = async () => {
    if (isScanning) return;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    setIsScanning(true);
    setResult(null);
    setStatus("loading");

    // ⏱ Timeout 5s → fail
    const timeout = setTimeout(() => {
      setResult("danger");
      setIsScanning(false);
      scanner.stop().catch(() => {});
    }, 5000);

    setScanTimeout(timeout);

    await scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string) => {
          try {
            // clear timeout
            if (scanTimeout) clearTimeout(scanTimeout);

            localStorage.setItem("lastQR", decodedText);

            const product = await getProduct(decodedText);
            setProduct(product);

            const ai = await analyzeColor();
            setAI(ai);

            setStatus("done");

            // 📳 rung
            navigator.vibrate?.(200);

            // 💡 flash effect
            flashScreen();

            // 🎯 result
            if (ai.status === "fresh") {
              setResult("fresh");
            } else {
              setResult("danger");
            }

            await stopScan();
          } catch (err) {
            console.error(err);
            setStatus("error");
          }
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera error:", err);
        alert("⚠️ Không mở được camera");
        setIsScanning(false);
      });
  };

  // 💡 FLASH EFFECT
  const flashScreen = () => {
    const flash = document.createElement("div");
    flash.className =
      "fixed inset-0 bg-white z-[9999] opacity-80 transition-opacity duration-300";
    document.body.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = "0";
      setTimeout(() => document.body.removeChild(flash), 300);
    }, 100);
  };

  // 🛑 STOP
  const stopScan = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera */}
      <div id="reader" className="w-full h-full" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* Khung scan */}
      {isScanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-[70vw] max-w-[300px] aspect-square border-4 border-green-400 rounded-xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse" />
          </div>

          {/* TEXT ĐANG QUÉT */}
          <p className="mt-4 text-white animate-pulse">
            🔍 Đang quét...
          </p>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 w-full p-4 text-center text-white font-bold bg-black/40">
        BioSmart Wrap
      </div>

      {/* Button */}
      {!result && (
        <div className="absolute bottom-0 w-full p-6 flex justify-center bg-black/40">
          {!isScanning ? (
            <button
              onClick={startScan}
              className="w-64 bg-green-500 text-white py-3 rounded-full text-lg font-semibold"
            >
              📷 Bắt đầu quét
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="w-64 bg-red-500 text-white py-3 rounded-full text-lg font-semibold"
            >
              ⛔ Dừng quét
            </button>
          )}
        </div>
      )}

      {/* 🎯 RESULT */}
      {result && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center text-white text-center
          ${
            result === "fresh"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          <h1 className="text-3xl font-bold mb-3">
            {result === "fresh"
              ? "🟢 Thực phẩm còn tươi"
              : "🔴 QR bị hỏng – thực phẩm không an toàn"}
          </h1>

          {aiResult && (
            <p className="mb-2">pH: {aiResult.ph}</p>
          )}

          {product && (
            <p className="text-sm opacity-80">
              {product.name} - {product.supplier}
            </p>
          )}

          <button
            onClick={startScan}
            className="mt-6 bg-white text-black px-6 py-2 rounded-full"
          >
            🔄 Quét lại
          </button>
        </div>
      )}
    </div>
  );
}