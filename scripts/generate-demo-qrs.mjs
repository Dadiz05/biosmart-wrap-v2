import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const outDir = path.resolve("public", "qr");
await fs.mkdir(outDir, { recursive: true });

const item = { id: "QR-ORIGINAL-FRESH", label: "Mã gốc chuẩn ban đầu", dark: "#6d28d9" };
const svg = await QRCode.toString(item.id, {
  type: "svg",
  margin: 2,
  width: 512,
  color: { dark: item.dark, light: "#ffffff" },
});
const file = path.join(outDir, "original-fresh.svg");
await fs.writeFile(file, svg, "utf8");
console.log("wrote", file, "-", item.label);

