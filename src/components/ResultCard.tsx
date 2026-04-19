import { useStore } from "../store/useStore";
import StatusBadge from "./StatusBadge";

export default function ResultCard() {
  const { product, aiResult } = useStore();

  if (!product || !aiResult) return null;

  return (
    <div className="p-4 bg-white shadow-xl rounded-xl mt-4">
      <h2 className="text-xl font-bold">{product.name}</h2>

      <p>🏭 {product.supplier}</p>
      <p>📅 {product.packDate}</p>

      <div className="mt-3">
        <StatusBadge status={aiResult.status} />
      </div>

      <p className="mt-2">🌡 pH: {aiResult.ph}</p>
      <p>🎨 Color: {aiResult.color}</p>

      {aiResult.status === "spoiled" && (
        <p className="text-red-600 mt-2">
          ⚠️ Thực phẩm có dấu hiệu hỏng!
        </p>
      )}
    </div>
  );
}