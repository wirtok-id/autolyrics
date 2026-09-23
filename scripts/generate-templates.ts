/**
 * Generate gradient template backgrounds for ffmpeg rendering
 * Run: npx tsx scripts/generate-templates.ts
 */
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const WIDTH = 1280;
const HEIGHT = 720;
const OUTPUT_DIR = path.join(__dirname, "..", "public", "templates");

// Ensure output dir exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function drawGradient(
  ctx: any,
  width: number,
  height: number,
  color1: string,
  color2: string,
  direction: "diagonal" | "vertical" | "radial" = "diagonal"
) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let t: number;
      if (direction === "diagonal") {
        t = (x / width + y / height) / 2;
      } else if (direction === "vertical") {
        t = y / height;
      } else {
        // radial from center
        const cx = width / 2;
        const cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        t = Math.min(1, dist / (maxDist * 0.6));
      }

      imageData.data[idx] = lerp(c1.r, c2.r, t);
      imageData.data[idx + 1] = lerp(c1.g, c2.g, t);
      imageData.data[idx + 2] = lerp(c1.b, c2.b, t);
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function addVignette(ctx: any, width: number, height: number, intensity: number = 0.4) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const t = Math.min(1, dist / maxDist);
      const darken = 1 - t * t * intensity;

      imageData.data[idx] = Math.round(imageData.data[idx] * darken);
      imageData.data[idx + 1] = Math.round(imageData.data[idx + 1] * darken);
      imageData.data[idx + 2] = Math.round(imageData.data[idx + 2] * darken);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// 1. Gradient Dark: purple (#A855F7) → blue (#3B82F6), diagonal
const canvas1 = createCanvas(WIDTH, HEIGHT);
const ctx1 = canvas1.getContext("2d");
drawGradient(ctx1, WIDTH, HEIGHT, "#A855F7", "#3B82F6", "diagonal");
fs.writeFileSync(
  path.join(OUTPUT_DIR, "gradient-dark.png"),
  canvas1.toBuffer("image/png")
);
console.log("✅ Generated gradient-dark.png");

// 2. Neon: dark purple center glow on black
const canvas2 = createCanvas(WIDTH, HEIGHT);
const ctx2 = canvas2.getContext("2d");
// Start with black
ctx2.fillStyle = "#000000";
ctx2.fillRect(0, 0, WIDTH, HEIGHT);
// Radial glow from center
drawGradient(ctx2, WIDTH, HEIGHT, "#7c3aed", "#000000", "radial");
// Add vignette
addVignette(ctx2, WIDTH, HEIGHT, 0.6);
fs.writeFileSync(
  path.join(OUTPUT_DIR, "neon.png"),
  canvas2.toBuffer("image/png")
);
console.log("✅ Generated neon.png");

// 3. Minimalist: dark solid with subtle gradient
const canvas3 = createCanvas(WIDTH, HEIGHT);
const ctx3 = canvas3.getContext("2d");
drawGradient(ctx3, WIDTH, HEIGHT, "#1a1a2e", "#0f0f1a", "vertical");
addVignette(ctx3, WIDTH, HEIGHT, 0.3);
fs.writeFileSync(
  path.join(OUTPUT_DIR, "minimalist.png"),
  canvas3.toBuffer("image/png")
);
console.log("✅ Generated minimalist.png");

console.log("\nAll templates generated in", OUTPUT_DIR);
