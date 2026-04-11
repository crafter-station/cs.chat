import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBLIC = join(import.meta.dir, "..", "public");

const ROSE = "#A94571";
const BG_DARK = "#1a1a1a";
const WHITE = "#ffffff";
const TEXT_LIGHT = "#e5e5e5";

function logoSvg(size: number) {
  const fontSize = size * 0.38;
  const dotSize = fontSize * 0.9;
  const subtitleSize = size * 0.1;
  const yCenter = size * 0.46;
  const subtitleY = yCenter + fontSize * 0.52;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG_DARK}"/>
  <text x="50%" y="${yCenter}" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${fontSize}" fill="${WHITE}" letter-spacing="-1">
    C3<tspan fill="${ROSE}" font-size="${dotSize}">.</tspan>
  </text>
  <text x="50%" y="${subtitleY}" text-anchor="middle" dominant-baseline="hanging"
    font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="${subtitleSize}" fill="${TEXT_LIGHT}" letter-spacing="2">
    chat
  </text>
</svg>`;
}

function ogSvg(width: number, height: number) {
  const logoSize = height * 0.32;
  const dotSize = logoSize * 0.9;
  const taglineSize = height * 0.055;

  // Subtle rose glow behind logo
  const glowR = height * 0.35;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="46%" r="40%">
      <stop offset="0%" stop-color="${ROSE}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${ROSE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#141414"/>
      <stop offset="100%" stop-color="#1e1e1e"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width / 2}" cy="${height * 0.44}" r="${glowR}" fill="url(#glow)"/>
  <text x="50%" y="44%" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${logoSize}" fill="${WHITE}" letter-spacing="-2">
    C3<tspan fill="${ROSE}" font-size="${dotSize}">.</tspan>chat
  </text>
  <text x="50%" y="60%" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif" font-weight="300" font-size="${taglineSize}" fill="${TEXT_LIGHT}" letter-spacing="1.5" opacity="0.7">
    by Crafter Station
  </text>
  <line x1="${width * 0.42}" y1="${height * 0.52}" x2="${width * 0.58}" y2="${height * 0.52}" stroke="${ROSE}" stroke-opacity="0.3" stroke-width="1"/>
</svg>`;
}

async function generateOg(
  name: string,
  width: number,
  height: number
) {
  const svg = ogSvg(width, height);
  await sharp(Buffer.from(svg)).png().toFile(join(PUBLIC, name));
  console.log(`  ✓ ${name} (${width}×${height})`);
}

async function generateFavicon() {
  const sizes = [16, 32, 48, 128, 256];
  const pngs: Buffer[] = [];

  for (const size of sizes) {
    const svg = logoSvg(size);
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    pngs.push(buf);
  }

  // Also save a 512px PNG for apple-touch-icon / web manifest
  const svg512 = logoSvg(512);
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(join(PUBLIC, "icon-512.png"));
  console.log("  ✓ icon-512.png (512×512)");

  // apple-touch-icon 180×180
  const svg180 = logoSvg(180);
  await sharp(Buffer.from(svg180))
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png (180×180)");

  const ico = await pngToIco(pngs);
  writeFileSync(join(PUBLIC, "favicon.ico"), ico);
  console.log("  ✓ favicon.ico (16, 32, 48, 128, 256)");
}

async function main() {
  console.log("Generating brand assets...\n");

  console.log("OG Images:");
  await generateOg("og.png", 1200, 630);
  await generateOg("og-twitter.png", 1200, 600);

  console.log("\nFavicon & Icons:");
  await generateFavicon();

  console.log("\nDone!");
}

main().catch(console.error);
