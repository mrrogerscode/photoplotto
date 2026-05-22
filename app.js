const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 }
};

const MAX_LAYER_COUNT = 4;
const DEFAULT_LAYER_COLORS = ["#111111", "#d64f3f", "#2f7c7f", "#d2a12a"];

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
const addLayerBtn = document.getElementById("addLayerBtn");
const layerRowsEl = document.getElementById("layerRows");
const layerSummaryEl = document.getElementById("layerSummary");
const moodInput = document.getElementById("moodSelect");
const moodDetailsEl = document.getElementById("moodDetails");
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
const previewLayerSummaryEl = document.getElementById("previewLayerSummary");
const conditionalControls = [...document.querySelectorAll(".control-visibility")];
const rangeInputs = [...document.querySelectorAll('input[type="range"][data-value-target]')];
const collapsibleGroups = [...document.querySelectorAll(".control-group[data-collapsible]")];
const shapeRegistry = Array.isArray(window.PhotoPlottoShapes) ? window.PhotoPlottoShapes : [];
const shapeMap = new Map(shapeRegistry.map((shape) => [shape.id, shape]));
const moodRegistry = Array.isArray(window.PhotoPlottoShapeMoods) ? window.PhotoPlottoShapeMoods : [];
const moodMap = new Map(moodRegistry.map((mood) => [mood.id, mood]));
const toolRegistry = Array.isArray(window.PhotoPlottoTools) ? window.PhotoPlottoTools : [];
const toolMap = new Map(toolRegistry.map((tool) => [tool.id, tool]));

let loadedImageBitmap = null;
let workingImageData = null;
let lastRender = null;
let activeLayerCount = 1;

initializeShapeControls();
initializeLayerControls();
initializeRangeValueDisplays();
initializeCollapsibleControls();

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
  updateLayerConfigurationSummary();
  renderPipeline();
});

[...document.querySelectorAll("input, select")].forEach((control) => {
  if (control === imageInput) {
    return;
  }

  control.addEventListener("input", () => {
    if (control instanceof HTMLInputElement && control.type === "range") {
      updateRangeValueDisplay(control);
    }
    if (control === moodInput) {
      applyMoodPreset(control.value);
    } else if (isShapeMoodTuningControl(control)) {
      setMoodSelection("custom");
    }
    syncControlVisibility();
    updateLayerRowsState();
    updateLayerConfigurationSummary();
    if (!loadedImageBitmap) {
      return;
    }
    renderPipeline();
  });
});

syncControlVisibility();
updateLayerRowsState();
updateLayerConfigurationSummary();

addLayerBtn.addEventListener("click", () => {
  setActiveLayerCount(activeLayerCount + 1);
});

layerRowsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".layer-row__remove");
  if (!button) {
    return;
  }

  const row = button.closest(".layer-row");
  const index = Number(row?.dataset.layerIndex);
  if (!Number.isFinite(index) || index >= activeLayerCount || activeLayerCount <= 1) {
    return;
  }

  removeLayerAt(index);
});

renderBtn.addEventListener("click", () => {
  renderPipeline();
});

exportBtn.addEventListener("click", () => {
  if (!lastRender?.exportLayers?.length) {
    return;
  }

  for (const layer of lastRender.exportLayers) {
    downloadSvg(layer.svg, layer.fileName);
  }
});

function setStatus(message) {
  statusEl.textContent = message;
}

function initializeCollapsibleControls() {
  for (const group of collapsibleGroups) {
    const button = group.querySelector(".control-group__toggle");
    const body = group.querySelector(".control-group__body");
    if (!button || !body) {
      continue;
    }

    button.addEventListener("click", () => {
      setControlGroupCollapsed(group, body, button, !group.classList.contains("is-collapsed"));
    });

    setControlGroupCollapsed(group, body, button, group.hasAttribute("data-default-collapsed"));
  }
}

function setControlGroupCollapsed(group, body, button, collapsed) {
  group.classList.toggle("is-collapsed", collapsed);
  body.hidden = collapsed;
  button.setAttribute("aria-expanded", String(!collapsed));
  const label = button.querySelector(".control-group__toggleText");
  if (label) {
    label.textContent = collapsed ? "Expand" : "Collapse";
  }
}

function initializeRangeValueDisplays() {
  for (const input of rangeInputs) {
    updateRangeValueDisplay(input);
  }
}

function updateRangeValueDisplay(input) {
  const targetId = input.dataset.valueTarget;
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) {
    return;
  }

  const decimals = Number.parseInt(input.dataset.valueDecimals || "0", 10);
  const suffix = input.dataset.valueSuffix || "";
  target.textContent = `${Number(input.value).toFixed(decimals)}${suffix}`;
}

function initializeShapeControls() {
  if (!shapeRegistry.length) {
    throw new Error("PhotoPlottoShapes registry is empty.");
  }

  populateMoodSelect();
  renderAvailableShapes();
  populateShapeSelect(singleShapeInput);
  populateShapeSelect(bandDarkInput);
  populateShapeSelect(bandMidInput);
  populateShapeSelect(bandLightInput);
  applyMoodPreset(resolveMoodId(moodInput?.dataset.defaultMood));
}

function initializeLayerControls() {
  if (!toolRegistry.length) {
    throw new Error("PhotoPlottoTools registry is empty.");
  }

  layerRowsEl.innerHTML = "";
  for (let index = 0; index < MAX_LAYER_COUNT; index += 1) {
    layerRowsEl.append(createLayerRow(index));
  }

  setActiveLayerCount(1);
}

function createLayerRow(index) {
  const row = document.createElement("section");
  row.className = "layer-row";
  row.dataset.layerIndex = String(index);

  const header = document.createElement("div");
  header.className = "layer-row__header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "layer-row__title";
  const title = document.createElement("strong");
  title.textContent = `Layer ${index + 1}`;
  const swatch = document.createElement("span");
  swatch.className = "layer-row__swatch";
  titleGroup.append(title, swatch);

  const removeBtn = document.createElement("button");
  removeBtn.className = "layer-row__remove";
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  header.append(titleGroup, removeBtn);

  const fieldRow = document.createElement("div");
  fieldRow.className = "field-row";

  const colorField = document.createElement("label");
  colorField.className = "field";
  const colorLabel = document.createElement("span");
  colorLabel.textContent = "Layer Color";
  const colorInput = document.createElement("input");
  colorInput.className = "layer-color";
  colorInput.type = "color";
  colorInput.value = DEFAULT_LAYER_COLORS[index] || DEFAULT_LAYER_COLORS[0];
  colorField.append(colorLabel, colorInput);

  const toolField = document.createElement("label");
  toolField.className = "field";
  const toolLabel = document.createElement("span");
  toolLabel.textContent = "Tool Profile";
  const toolSelect = document.createElement("select");
  toolSelect.className = "layer-tool";
  populateToolSelect(toolSelect, getDefaultToolId());
  toolField.append(toolLabel, toolSelect);

  fieldRow.append(colorField, toolField);

  const details = document.createElement("p");
  details.className = "helper-text layer-row__details";

  row.append(header, fieldRow, details);
  updateLayerRowPresentation(row, index < activeLayerCount);
  return row;
}

function populateToolSelect(selectEl, defaultToolId) {
  selectEl.innerHTML = "";

  for (const tool of toolRegistry) {
    const option = document.createElement("option");
    option.value = tool.id;
    option.textContent = tool.label;
    option.selected = tool.id === defaultToolId;
    selectEl.append(option);
  }
}

function updateLayerRowsState() {
  const rows = [...layerRowsEl.querySelectorAll(".layer-row")];
  for (const row of rows) {
    const index = Number(row.dataset.layerIndex);
    updateLayerRowPresentation(row, index < activeLayerCount, index);
  }

  addLayerBtn.disabled = activeLayerCount >= MAX_LAYER_COUNT;
}

function updateLayerRowPresentation(row, isActive, index = Number(row.dataset.layerIndex)) {
  row.hidden = !isActive;
  if (!isActive) {
    return;
  }

  const title = row.querySelector("strong");
  const colorInput = row.querySelector(".layer-color");
  const toolSelect = row.querySelector(".layer-tool");
  const swatch = row.querySelector(".layer-row__swatch");
  const details = row.querySelector(".layer-row__details");
  const removeBtn = row.querySelector(".layer-row__remove");
  const tool = getToolProfile(toolSelect.value);
  title.textContent = `Layer ${index + 1}`;
  swatch.style.backgroundColor = colorInput.value;
  removeBtn.hidden = index === 0;
  details.textContent = `${tool.label}. Single-pass line width ${fmt(tool.minStrokeMm)}-${fmt(tool.maxStrokeMm)}mm. Recommended cell size ${fmt(tool.recommendedCellSizeMm)}mm.`;
}

function setActiveLayerCount(nextCount) {
  activeLayerCount = clampLayerCount(nextCount);
  updateLayerRowsState();
  updateLayerConfigurationSummary();
  if (loadedImageBitmap) {
    renderPipeline();
  }
}

function removeLayerAt(index) {
  if (activeLayerCount <= 1 || index <= 0 || index >= activeLayerCount) {
    return;
  }

  const rows = [...layerRowsEl.querySelectorAll(".layer-row")];
  for (let current = index; current < activeLayerCount - 1; current += 1) {
    const sourceRow = rows[current + 1];
    const targetRow = rows[current];
    targetRow.querySelector(".layer-color").value = sourceRow.querySelector(".layer-color").value;
    targetRow.querySelector(".layer-tool").value = sourceRow.querySelector(".layer-tool").value;
  }

  applyLayerRowDefaults(rows[activeLayerCount - 1], activeLayerCount - 1);

  setActiveLayerCount(activeLayerCount - 1);
}

function applyLayerRowDefaults(row, index) {
  row.querySelector(".layer-color").value = DEFAULT_LAYER_COLORS[index] || DEFAULT_LAYER_COLORS[0];
  row.querySelector(".layer-tool").value = getDefaultToolId();
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

function populateMoodSelect() {
  if (!moodInput) {
    return;
  }

  moodInput.innerHTML = "";

  for (const mood of moodRegistry) {
    const option = document.createElement("option");
    option.value = mood.id;
    option.textContent = mood.label;
    moodInput.append(option);
  }

  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom";
  moodInput.append(customOption);
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

function applyMoodPreset(moodId) {
  const mood = moodMap.get(resolveMoodId(moodId));
  if (!mood) {
    setMoodSelection("custom");
    return;
  }

  const enabledShapeIds = new Set(mood.enabledShapeIds.map((shapeId) => resolveShapeId(shapeId)));
  for (const input of getShapeToggleInputs()) {
    input.checked = enabledShapeIds.has(resolveShapeId(input.value));
  }

  singleShapeInput.value = resolveShapeId(mood.defaults.singleShape);
  bandDarkInput.value = resolveShapeId(mood.defaults.bandDark);
  bandMidInput.value = resolveShapeId(mood.defaults.bandMid);
  bandLightInput.value = resolveShapeId(mood.defaults.bandLight);
  setMoodSelection(mood.id);
}

function setMoodSelection(moodId) {
  if (!moodInput) {
    return;
  }

  const resolvedMoodId = moodId === "custom" ? "custom" : resolveMoodId(moodId);
  moodInput.value = resolvedMoodId || "custom";
  const mood = moodMap.get(resolvedMoodId);
  moodDetailsEl.textContent = mood
    ? `${mood.description} Choose a visual family of shapes, then fine-tune individual shape choices below.`
    : "Choose a visual family of shapes, then fine-tune individual shape choices below.";
}

function getShapeToggleInputs() {
  return [...document.querySelectorAll(".shapeToggle")];
}

function isShapeMoodTuningControl(control) {
  return control === singleShapeInput
    || control === bandDarkInput
    || control === bandMidInput
    || control === bandLightInput
    || control.classList.contains("shapeToggle");
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
  const artwork = generateLayeredArtwork(workingImageData, grayscale, params);

  if (!artwork) {
    lastRender = null;
    svgPreview.innerHTML = "";
    exportBtn.disabled = true;
    return;
  }

  lastRender = artwork;
  svgPreview.innerHTML = artwork.previewSvg;
  updatePreviewLayerSummary(artwork.exportLayers);
  exportBtn.disabled = !artwork.exportLayers.length;
}

function updateLayerConfigurationSummary() {
  const layers = getConfiguredLayers();
  const heading = `${layers.length} active layer${layers.length === 1 ? "" : "s"}.`;
  const details = layers
    .map((layer) => `Layer ${layer.index + 1}: ${layer.colorHex.toUpperCase()} with ${layer.tool.label}`)
    .join("<br />");
  layerSummaryEl.innerHTML = `${heading}<br />${details}`;
}

function updatePreviewLayerSummary(layers) {
  previewLayerSummaryEl.innerHTML = layers
    .map((layer) => `<li><span class="preview-layer-summary__swatch" style="background:${layer.colorHex}"></span>Layer ${layer.index + 1}: ${layer.shapeCount} shapes, ${layer.toolLabel}</li>`)
    .join("");
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
    mappingMode: mappingModeInput.value || "density",
    styleMode: styleModeInput.value,
    cellSizeMm: Math.max(0.8, Number(cellSizeMmInput.value) || 3),
    invert: invertInput.checked,
    gamma: Math.max(0.2, Number(gammaInput.value) || 1),
    contrast: Number(contrastInput.value) || 0,
    densityStrength: Math.min(1, Math.max(0, Number(densityStrengthInput.value) || 0.7)),
    singleShape: resolveShapeId(singleShapeInput.value),
    seed: Number(seedInput.value) || 42,
    bandDark: resolveShapeId(bandDarkInput.value),
    bandMid: resolveShapeId(bandMidInput.value),
    bandLight: resolveShapeId(bandLightInput.value),
    enabledShapes: [...document.querySelectorAll(".shapeToggle:checked")].map((el) => resolveShapeId(el.value)),
    layers: getConfiguredLayers()
  };
}

function getConfiguredLayers() {
  const rows = [...layerRowsEl.querySelectorAll(".layer-row")].slice(0, activeLayerCount);
  return rows.map((row, index) => {
    const colorHex = row.querySelector(".layer-color").value;
    const tool = getToolProfile(row.querySelector(".layer-tool").value);
    return {
      index,
      colorHex,
      colorRgb: hexToRgb(colorHex),
      tool,
      toolId: tool.id
    };
  });
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

function generateLayeredArtwork(colorImageData, grayscale, params) {
  const page = getOrientedPage(params.pageSize, params.pageOrientation);
  const margin = Math.min(params.marginMm, Math.min(page.width, page.height) * 0.4);
  const drawWidth = page.width - margin * 2;
  const drawHeight = page.height - margin * 2;

  if (drawWidth <= 0 || drawHeight <= 0) {
    setStatus("Margin is too large for the selected page size.");
    return null;
  }

  const fitted = fitRect(grayscale.width, grayscale.height, drawWidth, drawHeight);
  const artX = margin + (drawWidth - fitted.width) * 0.5;
  const artY = margin + (drawHeight - fitted.height) * 0.5;
  const cols = Math.max(1, Math.floor(fitted.width / params.cellSizeMm));
  const rows = Math.max(1, Math.floor(fitted.height / params.cellSizeMm));
  const cellW = fitted.width / cols;
  const cellH = fitted.height / rows;
  const baseSeed = (params.seed | 0) ^ (cols * 92821) ^ (rows * 68917);
  const layers = params.layers.map((layer) => ({ ...layer, shapes: [], shapeCount: 0 }));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellIndex = row * cols + col;
      const intensity = sampleCellIntensity(grayscale, col / cols, row / rows, 1 / cols, 1 / rows);
      const darkness = 1 - intensity;
      const layerIndex = pickLayerIndex(colorImageData, layers, col / cols, row / rows, 1 / cols, 1 / rows);
      const layer = layers[layerIndex];
      const rng = mulberry32(baseSeed + cellIndex * 1013904223);
      const shapeType = pickShape(params, darkness, rng);
      const centerX = artX + (col + 0.5) * cellW;
      const centerY = artY + (row + 0.5) * cellH;
      const count = getShapeCount(params, darkness, rng);

      for (let i = 0; i < count; i += 1) {
        const jitterX = (rng() - 0.5) * cellW * 0.65;
        const jitterY = (rng() - 0.5) * cellH * 0.65;
        const size = Math.min(cellW, cellH) * (0.26 + darkness * 0.42);
        const strokeWidth = getStrokeWidth(layer, params.mappingMode, darkness);
        const opacity = 0.35 + darkness * 0.65;
        const shapeSvg = buildShapeSvg(shapeType, centerX + jitterX, centerY + jitterY, size, strokeWidth, opacity);
        if (shapeSvg) {
          layer.shapes.push(shapeSvg);
          layer.shapeCount += 1;
        }
      }
    }
  }

  const borderElement = buildBorderSvg(params, artX, artY, fitted.width, fitted.height);
  const previewSvg = buildCompositePreviewSvg(page, margin, drawWidth, drawHeight, baseSeed, layers, borderElement);
  const exportLayers = layers.map((layer, index) => ({
    index,
    colorHex: layer.colorHex,
    toolLabel: layer.tool.label,
    shapeCount: layer.shapeCount,
    fileName: buildLayerFileName(index, layer),
    svg: buildLayerSvg(page, margin, drawWidth, drawHeight, baseSeed, params, layer, index === 0 ? borderElement : "")
  }));
  const totalShapes = exportLayers.reduce((sum, layer) => sum + layer.shapeCount, 0);
  setStatus(`Prepared ${exportLayers.length} layer${exportLayers.length === 1 ? "" : "s"} and ${totalShapes} shapes on ${params.pageSize} ${params.pageOrientation}.`);

  return {
    previewSvg,
    exportLayers
  };
}

function buildBorderSvg(params, artX, artY, fittedWidth, fittedHeight) {
  if (!params.borderEnabled) {
    return "";
  }

  const inset = Math.max(0, params.borderInsetMm);
  const borderX = artX + inset;
  const borderY = artY + inset;
  const borderW = fittedWidth - inset * 2;
  const borderH = fittedHeight - inset * 2;

  if (borderW <= 0 || borderH <= 0) {
    return "";
  }

  return `<rect x="${fmt(borderX)}" y="${fmt(borderY)}" width="${fmt(borderW)}" height="${fmt(borderH)}" stroke-width="${fmt(params.borderStrokeMm)}" stroke-opacity="1"/>`;
}

function buildCompositePreviewSvg(page, margin, drawWidth, drawHeight, baseSeed, layers, borderElement) {
  const clipId = `preview-clip-${Math.abs(baseSeed)}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}mm" height="${page.height}mm" viewBox="0 0 ${page.width} ${page.height}">`,
    `<defs><clipPath id="${clipId}"><rect x="${fmt(margin)}" y="${fmt(margin)}" width="${fmt(drawWidth)}" height="${fmt(drawHeight)}" /></clipPath></defs>`,
    `<rect x="0" y="0" width="${page.width}" height="${page.height}" fill="white"/>`,
    ...layers.map((layer) => `<g fill="none" stroke="${layer.colorHex}" clip-path="url(#${clipId})">${layer.shapes.join("\n")}</g>`),
    borderElement ? `<g fill="none" stroke="black">${borderElement}</g>` : "",
    `</svg>`
  ].join("\n");
}

function buildLayerSvg(page, margin, drawWidth, drawHeight, baseSeed, params, layer, borderElement) {
  const clipId = `layer-clip-${Math.abs(baseSeed)}-${layer.index}`;
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}mm" height="${page.height}mm" viewBox="0 0 ${page.width} ${page.height}">`,
    `<desc>Generated by PhotoPlotto: layer=${layer.index + 1}; color=${layer.colorHex}; tool=${layer.tool.label}; mapping=${params.mappingMode}; style=${params.styleMode}; seed=${params.seed}</desc>`,
    `<defs><clipPath id="${clipId}"><rect x="${fmt(margin)}" y="${fmt(margin)}" width="${fmt(drawWidth)}" height="${fmt(drawHeight)}" /></clipPath></defs>`,
    //`<rect x="0" y="0" width="${page.width}" height="${page.height}" fill="white"/>`,
    `<g fill="none" stroke="${layer.colorHex}" clip-path="url(#${clipId})">`,
    ...layer.shapes,
    `</g>`,
    borderElement ? `<g fill="none" stroke="black">${borderElement}</g>` : "",
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

function sampleCellColor(imageData, nx, ny, nw, nh) {
  const x = Math.min(imageData.width - 1, Math.floor((nx + nw * 0.5) * imageData.width));
  const y = Math.min(imageData.height - 1, Math.floor((ny + nh * 0.5) * imageData.height));
  const offset = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[offset],
    g: imageData.data[offset + 1],
    b: imageData.data[offset + 2]
  };
}

function pickLayerIndex(imageData, layers, nx, ny, nw, nh) {
  if (layers.length <= 1) {
    return 0;
  }

  const sample = sampleCellColor(imageData, nx, ny, nw, nh);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const layer of layers) {
    const distance = getColorDistance(sample, layer.colorRgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = layer.index;
    }
  }

  return bestIndex;
}

function getColorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
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

function getStrokeWidth(layer, mappingMode, darkness) {
  const minWidth = Math.min(layer.tool.minStrokeMm, layer.tool.maxStrokeMm);
  const maxWidth = Math.max(layer.tool.minStrokeMm, layer.tool.maxStrokeMm);
  if (mappingMode === "density") {
    return Math.max(minWidth, layer.tool.tipWidthMm || minWidth);
  }

  return Math.max(minWidth + (maxWidth - minWidth) * darkness, layer.tool.tipWidthMm || minWidth);
}

function buildShapeSvg(shapeType, cx, cy, size, strokeWidth, opacity) {
  const shape = shapeMap.get(resolveShapeId(shapeType));
  if (!shape) {
    return "";
  }

  const normalizedStroke = size > 0 ? strokeWidth / size : strokeWidth;
  return `<g transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${fmt(size)})" stroke-width="${fmt(normalizedStroke)}" stroke-opacity="${fmt(opacity)}">${shape.markup}</g>`;
}

function downloadSvg(svg, fileName) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function buildLayerFileName(index, layer) {
  const colorToken = layer.colorHex.replace("#", "").toLowerCase();
  const toolToken = layer.toolId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `photoplotto-layer-${index + 1}-${colorToken}-${toolToken}.svg`;
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

function resolveMoodId(moodId) {
  if (moodId && moodMap.has(moodId)) {
    return moodId;
  }

  if (moodMap.has("technical")) {
    return "technical";
  }

  return moodRegistry[0]?.id || "";
}

function getDefaultToolId() {
  if (toolMap.has("01-liner")) {
    return "01-liner";
  }

  return toolRegistry[0]?.id || "";
}

function resolveToolId(toolId) {
  if (toolId && toolMap.has(toolId)) {
    return toolId;
  }

  return getDefaultToolId();
}

function getToolProfile(toolId) {
  const tool = toolMap.get(resolveToolId(toolId));
  if (tool) {
    return tool;
  }

  return {
    id: "default-tool",
    label: "Default Tool",
    tipWidthMm: 0.1,
    minStrokeMm: 0.12,
    maxStrokeMm: 0.35,
    recommendedCellSizeMm: 2,
    notes: "Fallback tool profile."
  };
}

function clampLayerCount(value) {
  const count = Number.parseInt(String(value || "1"), 10);
  return Math.max(1, Math.min(MAX_LAYER_COUNT, Number.isFinite(count) ? count : 1));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((ch) => ch + ch).join("")
    : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
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
