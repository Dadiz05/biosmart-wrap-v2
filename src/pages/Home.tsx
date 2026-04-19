import QRScanner from "../components/QRScanner";
import ResultCard from "../components/ResultCard";
import { useStore } from "../store/useStore";

export default function Home() {
  const { status } = useStore();

  return (
    <div className="p-4">
      {/* <h1 className="text-2xl font-bold text-center">
        BioSmart Wrap
      </h1> */}

      <QRScanner />

      {status === "loading" && <p>⏳ Đang phân tích...</p>}

      {status === "error" && (
        <p className="text-red-500">
          ⚠️ Không thể quét mã. Có thể thực phẩm đã hỏng.
        </p>
      )}

      <ResultCard />
    </div>
  );
}