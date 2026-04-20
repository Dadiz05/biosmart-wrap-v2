import { useStore } from "../store/useStore";
import StatusBadge from "./StatusBadge";

function colorLabel(color: "purple" | "blue" | "green" | "yellow") {
  switch (color) {
    case "purple":
      return "Tím";
    case "blue":
      return "Xanh lam";
    case "green":
      return "Xanh lục";
    case "yellow":
      return "Vàng";
  }
}

function phRange(status: "fresh" | "degraded" | "spoiled" | "critical") {
  switch (status) {
    case "fresh":
      return "5-6";
    case "degraded":
      return "6.5-7";
    case "spoiled":
      return "7.5-8.5";
    case "critical":
      return "8.5-9.5";
  }
}

function backgroundHex(status: "fresh" | "degraded" | "spoiled" | "critical") {
  switch (status) {
    case "fresh":
      return "#1fce10";
    case "degraded":
      return "#f7f60e";
    case "spoiled":
      return "#faa008";
    case "critical":
      return "#b81414";
  }
}

export default function ResultCard({ lightMode = false }: { lightMode?: boolean }) {
  const { aiResult } = useStore();

  if (!aiResult) return null;

  const colorToneClass =
    aiResult.status === "fresh"
      ? "bg-green-50 text-green-950 ring-green-200"
      : aiResult.status === "degraded"
        ? "bg-yellow-50 text-yellow-900 ring-yellow-200"
        : aiResult.status === "spoiled"
          ? "bg-orange-50 text-orange-900 ring-orange-200"
          : "bg-red-50 text-red-900 ring-red-200";

  return (
    <div
      className={`rounded-3xl p-4 shadow-xl ring-1 backdrop-blur ${
        lightMode ? "bg-white text-slate-900 ring-slate-200" : colorToneClass
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-sm font-semibold text-slate-700">Kết quả phân tích QR</div>
        <StatusBadge status={aiResult.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl p-3 ring-1 ${
            lightMode ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200"
          }`}
        >
          <div className="text-xs font-medium text-slate-600">🟩 Màu nền</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {backgroundHex(aiResult.status)}
          </div>
        </div>

        <div
          className={`rounded-2xl p-3 ring-1 ${
            lightMode ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200"
          }`}
        >
          <div className="text-xs font-medium text-slate-600">🌡 Độ pH</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {phRange(aiResult.status)}
          </div>
        </div>

        <div
          className={`rounded-2xl p-3 ring-1 ${
            lightMode ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200"
          }`}
        >
          <div className="text-xs font-medium text-slate-600">🎨 Màu chỉ thị pH</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {colorLabel(aiResult.color)}
          </div>
        </div>

        <div
          className={`rounded-2xl p-3 ring-1 ${
            lightMode ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200"
          }`}
        >
          <div className="text-xs font-medium text-slate-600">✅ Trạng thái</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            <StatusBadge status={aiResult.status} />
          </div>
        </div>
      </div>

      {aiResult.previewDataUrl && (
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-600 mb-2">Preview</div>
          <img
            src={aiResult.previewDataUrl}
            alt="Captured frame preview"
            className="w-full rounded-2xl ring-1 ring-black/5"
            loading="lazy"
          />
        </div>
      )}

      {aiResult.status === "critical" && (
        <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-rose-900 ring-1 ring-rose-200">
          <div className="text-sm font-semibold">⚠️ Cảnh báo</div>
          <div className="mt-1 text-sm">
            Mức pH cho thấy thực phẩm đã hỏng nặng. Vui lòng không sử dụng.
          </div>
        </div>
      )}
    </div>
  );
}