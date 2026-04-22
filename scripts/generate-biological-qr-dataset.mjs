import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const OUT_DIR = path.resolve("public", "qr", "dataset");
const QR_TEXT = "QR-ORIGINAL-FRESH";
const CANVAS = 1024;
const QUIET = 4;
const BASE_MARGIN = 72;

const STAGES = [
  {
    stage: 1,
    slug: "fresh",
    label: "Mã gốc - Tươi",
    color: "#800080",
    background: ["#ffffff", "#f7eff8"],
    blur: 0,
    contrast: 1.15,
    opacity: 1,
    distortion: 0,
    leach: 0,
    eraseFinder: false,
  },
  {
    stage: 2,
    slug: "mild-change",
    label: "Biến đổi nhẹ - Cần dùng ngay",
    color: "#7486ff",
    background: ["#fbfcff", "#eef2ff"],
    blur: 0.85,
    contrast: 0.92,
    opacity: 0.96,
    distortion: 4,
    leach: 0.08,
    eraseFinder: false,
  },
  {
    stage: 3,
    slug: "warning",
    label: "Cảnh báo - Biến dạng nặng",
    color: "#587b36",
    background: ["#f4f8ef", "#e7edd9"],
    blur: 0.45,
    contrast: 0.78,
    opacity: 0.88,
    distortion: 12,
    leach: 0.24,
    eraseFinder: false,
  },
  {
    stage: 4,
    slug: "danger",
    label: "Nguy hiểm - Hỏng hoàn toàn",
    color: "#e5d99b",
    background: ["#fff9d7", "#f4efb3"],
    blur: 1.25,
    contrast: 0.45,
    opacity: 0.65,
    distortion: 16,
    leach: 0.45,
    eraseFinder: true,
  },
];

const CAMERA_VARIANTS = [
  { key: "front", label: "trực diện", rotate: 0, skewX: 0, skewY: 0, scale: 1, tx: 0, ty: 0 },
  { key: "tilt", label: "góc nghiêng", rotate: -8, skewX: -6, skewY: 2, scale: 0.98, tx: -12, ty: 10 },
  { key: "macro", label: "cận cảnh macro", rotate: 4, skewX: 3, skewY: -2, scale: 1.18, tx: 8, ty: 2 },
];

await fs.mkdir(OUT_DIR, { recursive: true });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeXml(value) {
  return value.replace(/[&<>"]+/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return char;
    }
  });
}

function seededValue(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function moduleRects(qr, stage) {
  const size = qr.modules.size;
  const cell = (CANVAS - BASE_MARGIN * 2) / (size + QUIET * 2);
  const rects = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!qr.modules.data[y * size + x]) continue;
      const px = BASE_MARGIN + (x + QUIET) * cell;
      const py = BASE_MARGIN + (y + QUIET) * cell;
      rects.push(`<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${(cell * 0.06).toFixed(2)}" />`);
    }
  }

  const finderCover = stage.eraseFinder ? buildFinderPatternMasks(qr) : "";
  return { size, cell, rects, finderCover };
}

function buildFinderPatternMasks(qr) {
  const size = qr.modules.size;
  const cell = (CANVAS - BASE_MARGIN * 2) / (size + QUIET * 2);
  const cover = [];
  const boxes = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];

  for (const [x, y] of boxes) {
    const px = BASE_MARGIN + (x + QUIET) * cell - cell * 0.4;
    const py = BASE_MARGIN + (y + QUIET) * cell - cell * 0.4;
    const width = cell * 7.8;
    const height = cell * 7.8;
    cover.push(`<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="${(cell * 0.8).toFixed(2)}" fill="#fff8cf" opacity="0.78" />`);
  }

  return cover.join("\n");
}

function buildNoiseDots(stage, variant, count = 120) {
  if (stage.stage === 1) return "";

  const dots = [];
  for (let i = 0; i < count; i += 1) {
    const seed = stage.stage * 1000 + variant.key.length * 77 + i;
    const x = Math.round(seededValue(seed + 1) * CANVAS);
    const y = Math.round(seededValue(seed + 2) * CANVAS);
    const r = clamp(seededValue(seed + 3) * (stage.stage === 4 ? 2.8 : 2.2) + 0.25, 0.15, 3.5);
    const alpha = stage.stage === 4 ? 0.25 : stage.stage === 3 ? 0.14 : 0.08;
    dots.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${stage.stage === 3 ? "#6ea35f" : "#7a6f52"}" opacity="${alpha.toFixed(3)}" />`);
  }
  return dots.join("\n");
}

function buildLeachOverlay(stage) {
  if (stage.leach <= 0) return "";
  const streaks = [];
  for (let i = 0; i < 18; i += 1) {
    const seed = stage.stage * 991 + i * 41;
    const x = Math.round(seededValue(seed + 1) * (CANVAS - 120));
    const y = Math.round(seededValue(seed + 2) * (CANVAS - 120));
    const w = Math.round(30 + seededValue(seed + 3) * 110);
    const h = Math.round(10 + seededValue(seed + 4) * 28);
    const rot = Math.round(-30 + seededValue(seed + 5) * 60);
    streaks.push(`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" transform="rotate(${rot} ${x} ${y})" fill="${stage.stage === 3 ? "#8ab36b" : "#f5eab0"}" opacity="${(stage.leach * 0.48).toFixed(2)}" />`);
  }
  return streaks.join("\n");
}

function buildFilter(stage, variant) {
  const blur = stage.blur.toFixed(2);
  const contrast = stage.contrast.toFixed(2);
  const displacement = stage.distortion.toFixed(2);
  const turbulenceBase = 0.008 + stage.stage * 0.002 + (variant.key === "macro" ? 0.003 : 0);

  return `
    <filter id="film-${stage.stage}-${variant.key}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="${contrast} 0 0 0 0 0 ${contrast} 0 0 0 0 0 ${contrast} 0 0 0 0 0 1 0" result="contrast" />
      <feTurbulence type="fractalNoise" baseFrequency="${turbulenceBase.toFixed(4)}" numOctaves="2" seed="${stage.stage * 17 + variant.key.length}" result="noise" />
      <feDisplacementMap in="contrast" in2="noise" scale="${displacement}" xChannelSelector="R" yChannelSelector="G" result="warp" />
      <feMerge>
        <feMergeNode in="warp" />
      </feMerge>
    </filter>
  `;
}

function buildAllFilters(stage) {
  return CAMERA_VARIANTS.map((variant) => buildFilter(stage, variant)).join("\n");
}

function buildCameraTransform(variant) {
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;
  const pieces = [
    `translate(${cx} ${cy})`,
    `rotate(${variant.rotate})`,
    `skewX(${variant.skewX})`,
    `skewY(${variant.skewY})`,
    `scale(${variant.scale})`,
    `translate(${-cx + variant.tx} ${-cy + variant.ty})`,
  ];
  return pieces.join(" ");
}

function buildBackground(stage) {
  return `
    <defs>
      <linearGradient id="bg-${stage.stage}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${stage.background[0]}" />
        <stop offset="100%" stop-color="${stage.background[1]}" />
      </linearGradient>
      ${buildAllFilters(stage)}
    </defs>
    <rect width="100%" height="100%" fill="url(#bg-${stage.stage})" />
    <rect x="40" y="40" width="944" height="944" rx="72" fill="#ffffff" opacity="0.24" />
    <rect x="72" y="72" width="880" height="880" rx="58" fill="#ffffff" opacity="0.15" />
  `;
}

function buildVariantSvg(stage, variant, qr) {
  const { size, cell, rects, finderCover } = moduleRects(qr, stage);
  const qrGroup = `
    <g transform="${buildCameraTransform(variant)}" filter="url(#film-${stage.stage}-${variant.key})" opacity="${stage.opacity}">
      <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="transparent" />
      <g fill="${stage.color}" shape-rendering="crispEdges">
        ${rects.join("\n")}
      </g>
      ${finderCover}
      <g fill="${stage.stage === 4 ? "#f3f0b4" : stage.stage === 3 ? "#7ea65c" : "#d8d4f9"}" opacity="${(stage.leach * 0.6).toFixed(2)}">
        ${buildLeachOverlay(stage)}
      </g>
      <g opacity="${stage.stage === 4 ? 0.30 : 0.12}">
        ${buildNoiseDots(stage, variant)}
      </g>
    </g>
  `;

  const caption = `${stage.label} • ${variant.label}`;
  const footerY = 974;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" role="img" aria-label="${escapeXml(caption)}">
  ${buildBackground(stage)}
  ${qrGroup}
  <g opacity="0.12">
    <circle cx="120" cy="130" r="84" fill="#ffffff" />
    <circle cx="900" cy="166" r="96" fill="#ffffff" />
    <circle cx="856" cy="860" r="124" fill="#ffffff" />
  </g>
  <text x="72" y="${footerY}" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#334155" opacity="0.72">${escapeXml(stage.label)}</text>
  <text x="72" y="${footerY + 28}" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#475569" opacity="0.74">${escapeXml(QR_TEXT)} • ${escapeXml(variant.label)}</text>
</svg>`;
}

const qr = QRCode.create(QR_TEXT, { errorCorrectionLevel: "H" });
const manifest = [];

for (const stage of STAGES) {
  for (const variant of CAMERA_VARIANTS) {
    const file = `stage-${stage.stage}-${stage.slug}-${variant.key}.svg`;
    const svg = buildVariantSvg(stage, variant, qr);
    await fs.writeFile(path.join(OUT_DIR, file), svg, "utf8");
    manifest.push({
      id: `${stage.stage}-${variant.key}`,
      stage: stage.stage,
      stageLabel: stage.label,
      cameraAngle: variant.label,
      variant: variant.key,
      qrText: QR_TEXT,
      file: `/qr/dataset/${file}`,
      size: `${CANVAS}x${CANVAS}`,
      target: stage.stage === 1 ? "fresh" : stage.stage === 2 ? "use-now" : stage.stage === 3 ? "warning" : "danger",
      notes: [
        stage.stage === 1 ? "Original crisp modules" : "BioSmart wrap simulation",
        stage.stage === 4 ? "Traditional QR scanners should fail" : "AI-assisted recognition target",
      ],
    });
  }
}

await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ qrText: QR_TEXT, generatedAt: new Date().toISOString(), items: manifest }, null, 2), "utf8");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BioSmart Biological QR Dataset</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #0f172a; color: #e2e8f0; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 20px; color: #cbd5e1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .card { background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 12px; }
    img { width: 100%; display: block; border-radius: 12px; background: white; }
    .meta { margin-top: 10px; font-size: 13px; }
    .title { font-weight: 700; }
    .small { color: #94a3b8; margin-top: 3px; }
    .badge { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 999px; background: #1f2937; color: #e2e8f0; font-size: 12px; }
    code { background: #1e293b; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>BioSmart Biological QR Dataset</h1>
  <p>Single original QR plus stage variants for AI training. Source text: <code>${QR_TEXT}</code>. Resolution: ${CANVAS}x${CANVAS}.</p>
  <div class="grid">
    ${manifest.map((item) => `
      <article class="card">
        <img src="${item.file}" alt="${item.id}" />
        <div class="meta">
          <div class="title">Stage ${item.stage} • ${item.cameraAngle}</div>
          <div class="small">${item.stageLabel}</div>
          <div class="small">Target: ${item.target}</div>
          <div class="badge">${item.file}</div>
        </div>
      </article>
    `).join("")}
  </div>
</body>
</html>`;

await fs.writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");
console.log(`Generated ${manifest.length} dataset items in ${OUT_DIR}`);
