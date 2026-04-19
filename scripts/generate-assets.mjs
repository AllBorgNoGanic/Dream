/**
 * Generate the source icon.png (1024×1024) and splash.png (2732×2732)
 * for Dream Shepherd, then run @capacitor/assets to fan them out into
 * every iOS/Android/Web size.
 *
 * Run: node scripts/generate-assets.mjs
 */
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..");
const ASSETS_DIR = path.join(ROOT, "assets");
const PUBLIC_DIR = path.join(ROOT, "public");

// Brand palette (matches app background and gold accents)
const NAVY_BG = "#04001a";
const NAVY_BG_DEEP = "#02000c";
const GOLD = "#e8b840";
const GOLD_SOFT = "#f5e4b0";

// ─── SVG composers ────────────────────────────────────────────────────────────

// A small generator for a starfield with consistent layout (deterministic seed)
function starsSvg({ count, w, h, opacityMin = 0.2, opacityMax = 0.7 }) {
  // Simple LCG so the same seed gives the same field
  let s = 1337;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.5 + rand() * 1.6;
    const o = opacityMin + rand() * (opacityMax - opacityMin);
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#ffffff" opacity="${o.toFixed(2)}"/>`);
  }
  return stars.join("\n  ");
}

// Embed the shepherd SVG body (colored gold, with a soft inner glow)
async function shepherdGroup({ size, cx, cy }) {
  const raw = await readFile(path.join(PUBLIC_DIR, "shepherd.svg"), "utf8");
  // Extract just the inner <g>...</g> – the file is fill="#000000" black,
  // so we re-color it gold via a wrapping group with fill override.
  const innerMatch = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const inner = innerMatch ? innerMatch[1].trim() : "";
  // The shepherd SVG uses a 423.2x423.2 viewBox. Scale to `size`.
  const scale = size / 423.2;
  const tx = cx - size / 2;
  const ty = cy - size / 2;
  return `
  <defs>
    <radialGradient id="shepherdGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="${GOLD}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shepherdFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_SOFT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${size * 0.78}" fill="url(#shepherdGlow)"/>
  <g transform="translate(${tx},${ty}) scale(${scale})" fill="url(#shepherdFill)">
    ${inner}
  </g>`;
}

// ─── Icon (1024×1024, square, no transparency – stores require opaque) ────────
async function buildIcon() {
  const SIZE = 1024;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // The shepherd silhouette renders best at ~62% of the canvas
  const shepherdSize = SIZE * 0.62;
  const shepherd = await shepherdGroup({ size: shepherdSize, cx, cy: cy + 12 });

  const stars = starsSvg({ count: 60, w: SIZE, h: SIZE, opacityMin: 0.25, opacityMax: 0.75 });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#160838"/>
      <stop offset="55%" stop-color="${NAVY_BG}"/>
      <stop offset="100%" stop-color="${NAVY_BG_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  ${stars}
  ${shepherd}
</svg>`;

  await mkdir(ASSETS_DIR, { recursive: true });
  await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, "icon.png"));

  // The "foreground" version for adaptive Android icons – same shepherd but
  // padded ~30% so the system can crop it into a circle without clipping.
  const FG_SIZE = 1024;
  const fgShepherdSize = FG_SIZE * 0.42;
  const fgShepherd = await shepherdGroup({ size: fgShepherdSize, cx: FG_SIZE / 2, cy: FG_SIZE / 2 + 6 });
  const fgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FG_SIZE}" height="${FG_SIZE}" viewBox="0 0 ${FG_SIZE} ${FG_SIZE}">
  ${fgShepherd}
</svg>`;
  await sharp(Buffer.from(fgSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, "icon-foreground.png"));

  // Solid background for adaptive icons
  const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FG_SIZE}" height="${FG_SIZE}" viewBox="0 0 ${FG_SIZE} ${FG_SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#160838"/>
      <stop offset="55%" stop-color="${NAVY_BG}"/>
      <stop offset="100%" stop-color="${NAVY_BG_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="${FG_SIZE}" height="${FG_SIZE}" fill="url(#bg)"/>
</svg>`;
  await sharp(Buffer.from(bgSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, "icon-background.png"));

  console.log("✓ icon.png, icon-foreground.png, icon-background.png");
}

// ─── Splash (2732×2732 – Capacitor crops to device aspect ratios) ─────────────
async function buildSplash() {
  const SIZE = 2732;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // The shepherd should be small relative to canvas because the splash gets
  // cropped down to phone aspect ratios. Capacitor uses the central ~1242×1242.
  const shepherdSize = 540;
  const shepherd = await shepherdGroup({ size: shepherdSize, cx, cy: cy - 60 });

  const stars = starsSvg({ count: 220, w: SIZE, h: SIZE, opacityMin: 0.18, opacityMax: 0.7 });

  const wordmarkY = cy + 320;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="65%">
      <stop offset="0%" stop-color="#160838"/>
      <stop offset="55%" stop-color="${NAVY_BG}"/>
      <stop offset="100%" stop-color="${NAVY_BG_DEEP}"/>
    </radialGradient>
    <linearGradient id="wordmarkFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_SOFT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  ${stars}
  ${shepherd}
  <text x="${cx}" y="${wordmarkY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="120"
        text-anchor="middle"
        fill="url(#wordmarkFill)"
        letter-spacing="4">
    Dream Shepherd
  </text>
  <text x="${cx}" y="${wordmarkY + 80}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="36"
        text-anchor="middle"
        fill="${GOLD}"
        opacity="0.55"
        letter-spacing="14">
    YOUR DREAMS HAVE MEANING
  </text>
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, "splash.png"));

  // Identical for dark mode (the app is dark-themed regardless of OS theme)
  await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, "splash-dark.png"));

  console.log("✓ splash.png, splash-dark.png");
}

// ─── Web favicons ─────────────────────────────────────────────────────────────
async function buildFavicons() {
  const sourceIcon = path.join(ASSETS_DIR, "icon.png");
  if (!existsSync(sourceIcon)) throw new Error("icon.png missing — run buildIcon first");

  const sizes = [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 192, name: "icon-192.png" },
    { size: 512, name: "icon-512.png" },
  ];

  for (const { size, name } of sizes) {
    await sharp(sourceIcon)
      .resize(size, size, { fit: "cover" })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(PUBLIC_DIR, name));
  }

  // .ico (multi-resolution favicon) – we just write the 48x48 PNG renamed,
  // which modern browsers accept. (A true .ico would need an extra dep.)
  await sharp(sourceIcon)
    .resize(48, 48, { fit: "cover" })
    .png()
    .toFile(path.join(PUBLIC_DIR, "favicon.ico"));

  console.log("✓ favicons (manifest.json preserved)");
}

// ─── Run @capacitor/assets to fan out to native projects ──────────────────────
function runCapacitorAssets() {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "npx.cmd" : "npx";
    const child = spawn(cmd, ["capacitor-assets", "generate", "--ios", "--android"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`capacitor-assets exited with code ${code}`));
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("→ Generating source icon.png + splash.png …");
  await buildIcon();
  await buildSplash();

  console.log("→ Generating web favicons …");
  await buildFavicons();

  console.log("→ Running @capacitor/assets …");
  await runCapacitorAssets();

  console.log("\n✓ All assets generated.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
