const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 }
};

const imageInput = document.getElementById("imageInput");
const pageSizeInput = document.getElementById("pageSize");
const pageOrientationInput = document.getElementById("pageOrientation");
const marginMmInput = document.getElementById("marginMm");
const borderEnabledInput = document.getElementById("borderEnabled");
const borderInsetMmInput = document.getElementById("borderInsetMm");
const borderStrokeMmInput = document.getElementById("borderStrokeMm");
const mappingModeInput = document.getElementById("mappingMode");
const styleModeInput = document.getElementById("styleMode");
const cellSizeMmInput = document.getElementById("cellSizeMm");
const invertInput = document.getElementById("invert");
const gammaInput = document.getElementById("gamma");
const contrastInput = document.getElementById("contrast");
const densityStrengthInput = document.getElementById("densityStrength");
const strokeMinInput = document.getElementById("strokeMin");
const strokeMaxInput = document.getElementById("strokeMax");
const singleShapeInput = document.getElementById("singleShape");
const seedInput = document.getElementById("seed");
const bandDarkInput = document.getElementById("bandDark");
const bandMidInput = document.getElementById("bandMid");
const bandLightInput = document.getElementById("bandLight");
const availableShapesEl = document.getElementById("availableShapes");
const renderBtn = document.getElementById("renderBtn");
const exportBtn = document.getElementById("exportBtn");
const statusEl = document.getElementById("status");
const grayscaleCanvas = document.getElementById("grayscaleCanvas");
const grayscaleCtx = grayscaleCanvas.getContext("2d", { willReadFrequently: true });
const svgPreview = document.getElementById("svgPreview");
const conditionalControls = [...document.querySelectorAll(".control-visibility")];
const shapeRegistry = Array.isArray(window.PhotoPlottoShapes) ? window.PhotoPlottoShapes : [];
const shapeMap = new Map(shapeRegistry.map((shape) => [shape.id, shape]));

let loadedImageBitmap = null;
let workingImageData = null;
let lastSvg = "";

initializeShapeControls();

imageInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setStatus("Please choose a PNG, JPEG, or WebP image.");
    return;
  }

  loadedImageBitmap = await createImageBitmap(file);
  setStatus(`Loaded ${file.name} (${loadedImageBitmap.width}x${loadedImageBitmap.height}).`);
  prepareWorkingImage();
  syncControlVisibility();
  renderPipeline();
});

[...document.querySelectorAll("input, select")].forEach((control) => {
  if (control === imageInput) {
    return;
  }
  control.addEventListener("input", () => {
    syncControlVisibility();
    if (!loadedImageBitmap) {
      return;
    }
    renderPipeline();
  });
});

syncControlVisibility();

renderBtn.addEventListener("click", () => {
  renderPipeline();
});

exportBtn.addEventListener("click", () => {
  if (!lastSvg) {
    return;
  }

  const blob = new Blob([lastSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `photoplotto-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
});

function setStatus(message) {
  statusEl.textContent = message;
}

function initializeShapeControls() {
  if (!shapeRegistry.length) {
    throw new Error("PhotoPlottoShapes registry is empty.");
  }

  renderAvailableShapes();
  populateShapeSelect(singleShapeInput);
  populateShapeSelect(bandDarkInput);
  populateShapeSelect(bandMidInput);
  populateShapeSelect(bandLightInput);
}

function renderAvailableShapes() {
  availableShapesEl.innerHTML = "";

  for (const shape of shapeRegistry) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.className = "shapeToggle";
    input.type = "checkbox";
    input.value = shape.id;
    input.checked = true;

    label.append(input, ` ${shape.label}`);
    availableShapesEl.append(label);
  }
}

function populateShapeSelect(selectEl) {
  const defaultShape = resolveShapeId(selectEl.dataset.defaultShape);
  selectEl.innerHTML = "";

  for (const shape of shapeRegistry) {
    const option = document.createElement("option");
    option.value = shape.id;
    option.textContent = shape.label;
    option.selected = shape.id === defaultShape;
    selectEl.append(option);
  }
}

function prepareWorkingImage() {
  if (!loadedImageBitmap) {
    return;
  }

  const maxDim = 1600;
  const ratio = Math.min(1, maxDim / Math.max(loadedImageBitmap.width, loadedImageBitmap.height));
  const width = Math.max(1, Math.round(loadedImageBitmap.width * ratio));
  const height = Math.max(1, Math.round(loadedImageBitmap.height * ratio));

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(loadedImageBitmap, 0, 0, width, height);
  workingImageData = ctx.getImageData(0, 0, width, height);
}

function renderPipeline() {
  if (!loadedImageBitmap || !workingImageData) {
    setStatus("Upload an image to begin.");
    return;
  }

  const params = readParams();
  const grayscale = computeGrayscale(workingImageData, params);
  drawGrayscalePreview(grayscale);
  const svg = generateSvg(grayscale, params);

  lastSvg = svg;
  svgPreview.innerHTML = svg;
  exportBtn.disabled = false;
}

function syncControlVisibility() {
  const mappingMode = mappingModeInput.value;
  const styleMode = styleModeInput.value;
  const borderEnabled = borderEnabledInput.checked;

  for (const element of conditionalControls) {
    const rule = element.dataset.visibleWhen;
    element.hidden = !matchesVisibilityRule(rule, { mappingMode, styleMode, borderEnabled });
  }
}

function matchesVisibilityRule(rule, state) {
  if (!rule) {
    return true;
  }

  if (rule === "borderEnabled") {
    return state.borderEnabled;
  }

  if (rule.startsWith("mapping:")) {
    const modes = rule.slice("mapping:".length).split("|");
    return modes.includes(state.mappingMode);
  }

  if (rule.startsWith("style:")) {
    const modes = rule.slice("style:".length).split("|");
    return modes.includes(state.styleMode);
  }

  return true;
}

function readParams() {
  return {
    pageSize: pageSizeInput.value,
    pageOrientation: pageOrientationInput.value,
    marginMm: Math.max(0, Number(marginMmInput.value) || 0),
    borderEnabled: borderEnabledInput.checked,
    borderInsetMm: Math.max(0, Number(borderInsetMmInput.value) || 0),
    borderStrokeMm: Math.max(0.05, Number(borderStrokeMmInput.value) || 0.35),
    mappingMode: mappingModeInput.value,
    styleMode: styleModeInput.value,
    cellSizeMm: Math.max(0.8, Number(cellSizeMmInput.value) || 3),
    invert: invertInput.checked,
    gamma: Math.max(0.2, Number(gammaInput.value) || 1),
    contrast: Number(contrastInput.value) || 0,
    densityStrength: Math.min(1, Math.max(0, Number(densityStrengthInput.value) || 0.7)),
    strokeMin: Math.max(0.05, Number(strokeMinInput.value) || 0.12),
    strokeMax: Math.max(0.1, Number(strokeMaxInput.value) || 0.6),
    singleShape: resolveShapeId(singleShapeInput.value),
    seed: Number(seedInput.value) || 42,
    bandDark: resolveShapeId(bandDarkInput.value),
    bandMid: resolveShapeId(bandMidInput.value),
    bandLight: resolveShapeId(bandLightInput.value),
    enabledShapes: [...document.querySelectorAll(".shapeToggle:checked")].map((el) => resolveShapeId(el.value))
  };
}

function computeGrayscale(imageData, params) {
  const { width, height, data } = imageData;
  const values = new Float32Array(width * height);
  const contrastFactor = getContrastFactor(params.contrast);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (params.invert) {
      lum = 1 - lum;
    }

    lum = clamp01((lum - 0.5) * contrastFactor + 0.5);
    lum = clamp01(Math.pow(lum, params.gamma));
    values[p] = lum;
  }

  return { width, height, values };
}

function drawGrayscalePreview(grayscale) {
  const { width, height, values } = grayscale;
  grayscaleCanvas.width = width;
  grayscaleCanvas.height = height;
  const imageData = grayscaleCtx.createImageData(width, height);

  for (let p = 0, i = 0; p < values.length; p += 1, i += 4) {
    const v = Math.round(values[p] * 255);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 255;
  }

  grayscaleCtx.putImageData(imageData, 0, 0);
}

function generateSvg(grayscale, params) {
  const page = getOrientedPage(params.pageSize, params.pageOrientation);
  const margin = Math.min(params.marginMm, Math.min(page.width, page.height) * 0.4);
  const drawWidth = page.width - margin * 2;
  const drawHeight = page.height - margin * 2;

  if (drawWidth <= 0 || drawHeight <= 0) {
    setStatus("Margin is too large for the selected page size.");
    return "";
  }

  const fitted = fitRect(grayscale.width, grayscale.height, drawWidth, drawHeight);
  const artX = margin + (drawWidth - fitted.width) * 0.5;
  const artY = margin + (drawHeight - fitted.height) * 0.5;
  const cols = Math.max(1, Math.floor(fitted.width / params.cellSizeMm));
  const rows = Math.max(1, Math.floor(fitted.height / params.cellSizeMm));
  const cellW = fitted.width / cols;
  const cellH = fitted.height / rows;

  const shapes = [];
  const frameElements = [];
  let shapeCount = 0;
  const baseSeed = (params.seed | 0) ^ (cols * 92821) ^ (rows * 68917);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellIndex = row * cols + col;
      const rng = mulberry32(baseSeed + cellIndex * 1013904223);
      const intensity = sampleCellIntensity(grayscale, col / cols, row / rows, 1 / cols, 1 / rows);
      const darkness = 1 - intensity;
      const shapeType = pickShape(params, darkness, rng);
      const centerX = artX + (col + 0.5) * cellW;
      const centerY = artY + (row + 0.5) * cellH;

      const count = getShapeCount(params, darkness, rng);
      for (let i = 0; i < count; i += 1) {
        const jitterX = (rng() - 0.5) * cellW * 0.65;
        const jitterY = (rng() - 0.5) * cellH * 0.65;
        const size = Math.min(cellW, cellH) * (0.26 + darkness * 0.42);
        const strokeWidth = getStrokeWidth(params, darkness);
        const opacity = 0.35 + darkness * 0.65;
        const shapeSvg = buildShapeSvg(shapeType, centerX + jitterX, centerY + jitterY, size, strokeWidth, opacity);
        if (shapeSvg) {
          shapes.push(shapeSvg);
          shapeCount += 1;
        }
      }
    }
  }

  if (params.borderEnabled) {
    const inset = Math.max(0, params.borderInsetMm);
    const borderX = artX + inset;
    const borderY = artY + inset;
    const borderW = fitted.width - inset * 2;
    const borderH = fitted.height - inset * 2;

    if (borderW > 0 && borderH > 0) {
      frameElements.push(
        `<rect x="${fmt(borderX)}" y="${fmt(borderY)}" width="${fmt(borderW)}" height="${fmt(borderH)}" stroke-width="${fmt(params.borderStrokeMm)}" stroke-opacity="1"/>`
      );
    }
  }

  setStatus(`Rendered ${shapeCount} shapes on ${params.pageSize} ${params.pageOrientation} with ${margin.toFixed(1)}mm margin.`);

  const clipId = `clip-${Math.abs(baseSeed)}`;
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}mm" height="${page.height}mm" viewBox="0 0 ${page.width} ${page.height}">`,
    `<desc>Generated by PhotoPlotto: mapping=${params.mappingMode}; style=${params.styleMode}; seed=${params.seed}</desc>`,
    `<defs><clipPath id="${clipId}"><rect x="${margin}" y="${margin}" width="${drawWidth}" height="${drawHeight}" /></clipPath></defs>`,
    `<rect x="0" y="0" width="${page.width}" height="${page.height}" fill="white"/>`,
    `<g fill="none" stroke="black" clip-path="url(#${clipId})">`,
    ...shapes,
    ...frameElements,
    `</g>`,
    `</svg>`
  ].join("\n");
}

function getOrientedPage(pageSize, pageOrientation) {
  const base = PAGE_SIZES_MM[pageSize] || PAGE_SIZES_MM.A4;
  if (pageOrientation === "landscape") {
    return { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) };
  }

  return { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) };
}

function fitRect(sourceWidth, sourceHeight, boundsWidth, boundsHeight) {
  const scale = Math.min(boundsWidth / sourceWidth, boundsHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale
  };
}

function sampleCellIntensity(grayscale, nx, ny, nw, nh) {
  const x = Math.min(grayscale.width - 1, Math.floor((nx + nw * 0.5) * grayscale.width));
  const y = Math.min(grayscale.height - 1, Math.floor((ny + nh * 0.5) * grayscale.height));
  return grayscale.values[y * grayscale.width + x];
}

function pickShape(params, darkness, rng) {
  const enabled = params.enabledShapes.length ? params.enabledShapes : [getDefaultShapeId()];

  if (params.styleMode === "single") {
    return params.singleShape;
  }

  if (params.styleMode === "banded") {
    if (darkness > 0.66) {
      return params.bandDark;
    }
    if (darkness > 0.33) {
      return params.bandMid;
    }
    return params.bandLight;
  }

  return enabled[Math.floor(rng() * enabled.length) % enabled.length];
}

function getShapeCount(params, darkness, rng) {
  if (params.mappingMode === "stroke") {
    return 1;
  }

  const base = darkness * (1 + params.densityStrength * 3);
  const count = Math.floor(base + rng() * 1.25);
  if (params.mappingMode === "density") {
    return Math.max(0, count);
  }

  return Math.max(1, count);
}

function getStrokeWidth(params, darkness) {
  const minWidth = Math.min(params.strokeMin, params.strokeMax);
  const maxWidth = Math.max(params.strokeMin, params.strokeMax);
  if (params.mappingMode === "density") {
    return minWidth;
  }

  return minWidth + (maxWidth - minWidth) * darkness;
}

function buildShapeSvg(shapeType, cx, cy, size, strokeWidth, opacity) {
  const shape = shapeMap.get(resolveShapeId(shapeType));
  if (!shape) {
    return "";
  }

  const normalizedStroke = size > 0 ? strokeWidth / size : strokeWidth;
  return `<g transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${fmt(size)})" stroke-width="${fmt(normalizedStroke)}" stroke-opacity="${fmt(opacity)}">${shape.markup}</g>`;
}

function getDefaultShapeId() {
  if (shapeMap.has("circle")) {
    return "circle";
  }

  return shapeRegistry[0]?.id || "";
}

function resolveShapeId(shapeId) {
  if (shapeId && shapeMap.has(shapeId)) {
    return shapeId;
  }

  return getDefaultShapeId();
}

function getContrastFactor(contrast) {
  const c = Math.max(-99, Math.min(99, contrast));
  return (259 * (c + 255)) / (255 * (259 - c));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function fmt(v) {
  return Number(v).toFixed(3);
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
