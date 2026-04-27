import * as THREE from "three";

export function createRockTextureSet() {
  return createProceduralTextureSet({
    palette: [
      { stop: 0, color: "#0e0d0b" },
      { stop: 0.24, color: "#26211c" },
      { stop: 0.58, color: "#4b4339" },
      { stop: 1, color: "#7c7062" },
    ],
    mode: "rock",
    seed: 2.13,
    scale: 4.2,
    contrast: 1.18,
    repeat: [3.6, 2.1],
  });
}

export function createIceTextureSet() {
  return createProceduralTextureSet({
    palette: [
      { stop: 0, color: "#10100f" },
      { stop: 0.22, color: "#242321" },
      { stop: 0.58, color: "#5d574d" },
      { stop: 1, color: "#b5ad9f" },
    ],
    mode: "ice",
    seed: 7.41,
    scale: 5.6,
    contrast: 1.08,
    repeat: [2.8, 1.9],
  });
}

export function createStoneTextureSet() {
  return createProceduralTextureSet({
    palette: [
      { stop: 0, color: "#4f3c2f" },
      { stop: 0.18, color: "#8e7660" },
      { stop: 0.52, color: "#cfbda6" },
      { stop: 0.84, color: "#ece2d4" },
      { stop: 1, color: "#ffffff" },
    ],
    mode: "stone",
    seed: 11.09,
    scale: 3.4,
    contrast: 1.08,
    repeat: [1.4, 1.4],
  });
}

export function createRadialSpriteTexture({
  innerColor = "rgba(255,255,255,1)",
  middleColor = "rgba(255,255,255,0.35)",
  outerColor = "rgba(255,255,255,0)",
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.4, middleColor);
  gradient.addColorStop(1, outerColor);

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createProceduralTextureSet({ palette, mode, seed, scale, contrast, repeat }) {
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = 256;
  colorCanvas.height = 256;
  const colorContext = colorCanvas.getContext("2d");
  const colorImage = colorContext.createImageData(colorCanvas.width, colorCanvas.height);

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bumpContext = bumpCanvas.getContext("2d");
  const bumpImage = bumpContext.createImageData(bumpCanvas.width, bumpCanvas.height);

  for (let y = 0; y < colorCanvas.height; y += 1) {
    for (let x = 0; x < colorCanvas.width; x += 1) {
      const u = x / colorCanvas.width;
      const v = y / colorCanvas.height;
      const height = getModeSample(mode, u, v, seed, scale);
      const graded = clamp01((height - 0.5) * contrast + 0.5);
      const color = samplePalette(palette, graded);
      const offset = (y * colorCanvas.width + x) * 4;

      colorImage.data[offset] = color.r;
      colorImage.data[offset + 1] = color.g;
      colorImage.data[offset + 2] = color.b;
      colorImage.data[offset + 3] = 255;

      const bumpValue = Math.round(clamp01(graded * 0.9 + height * 0.1) * 255);
      bumpImage.data[offset] = bumpValue;
      bumpImage.data[offset + 1] = bumpValue;
      bumpImage.data[offset + 2] = bumpValue;
      bumpImage.data[offset + 3] = 255;
    }
  }

  colorContext.putImageData(colorImage, 0, 0);
  bumpContext.putImageData(bumpImage, 0, 0);

  return {
    map: finalizeTexture(new THREE.CanvasTexture(colorCanvas), repeat, true),
    bumpMap: finalizeTexture(new THREE.CanvasTexture(bumpCanvas), repeat, false),
  };
}

function finalizeTexture(texture, repeat, isColor) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  if (isColor) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.needsUpdate = true;
  return texture;
}

function getModeSample(mode, u, v, seed, scale) {
  if (mode === "ice") {
    const warp = fbm(u * scale * 0.9, v * scale * 1.1, seed + 1.3, 5);
    const striation = Math.abs(
      Math.sin((u * scale * 7 + v * scale * 1.4 + warp * 4.2) * Math.PI),
    );
    const frost = fbm(u * scale * 2.8, v * scale * 3.2, seed + 9.4, 4);
    return clamp01(striation * 0.48 + frost * 0.52);
  }

  if (mode === "stone") {
    const base = fbm(u * scale, v * scale, seed, 5);
    const warp = fbm(u * scale * 1.5, v * scale * 1.2, seed + 3.8, 4);
    const veins = Math.pow(
      1 - Math.abs(Math.sin((u * scale * 5.2 + v * scale * 1.6 + warp * 3.2) * Math.PI)),
      5,
    );
    return clamp01(base * 0.75 + veins * 0.25);
  }

  const base = fbm(u * scale, v * scale, seed, 5);
  const ridge = 1 - Math.abs(fbm(u * scale * 1.8, v * scale * 1.6, seed + 6.4, 4) * 2 - 1);
  const grain = fbm(u * scale * 4.2, v * scale * 4.2, seed + 12.8, 3);
  return clamp01(base * 0.55 + ridge * 0.3 + grain * 0.15);
}

function fbm(x, y, seed, octaves) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let index = 0; index < octaves; index += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + index * 13.17);
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const n00 = hash(x0, y0, seed);
  const n10 = hash(x1, y0, seed);
  const n01 = hash(x0, y1, seed);
  const n11 = hash(x1, y1, seed);

  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  return lerp(ix0, ix1, sy);
}

function hash(x, y, seed) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function samplePalette(palette, t) {
  const clamped = clamp01(t);
  let previous = palette[0];
  let next = palette[palette.length - 1];

  for (let index = 1; index < palette.length; index += 1) {
    if (clamped <= palette[index].stop) {
      next = palette[index];
      previous = palette[index - 1];
      break;
    }
  }

  const range = next.stop - previous.stop || 1;
  const amount = clamp01((clamped - previous.stop) / range);
  const start = hexToRgb(previous.color);
  const end = hexToRgb(next.color);

  return {
    r: Math.round(lerp(start.r, end.r, amount)),
    g: Math.round(lerp(start.g, end.g, amount)),
    b: Math.round(lerp(start.b, end.b, amount)),
  };
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
