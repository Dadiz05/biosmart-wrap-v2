type Status = "fresh" | "warning" | "spoiled";

export default function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    fresh: "bg-green-500",
    warning: "bg-yellow-500",
    spoiled: "bg-red-500",
  };

  return (
    <span className={`px-3 py-1 text-white rounded ${map[status]}`}>
      {status}
    </span>
  );
}