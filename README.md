# PhotoPlotto

PhotoPlotto is a browser-only static app that converts images into layered geometric SVG artwork designed for pen plotting.

Repository: <https://github.com/mrrogerscode/photoplotto.git>

## Current Prototype

Implemented in this initial pass:

1. Upload PNG/JPEG/WebP images.
2. One to four ordered plotting layers, each with its own pen profile and color.
3. Grayscale conversion with invert, contrast, and gamma controls for geometry generation.
4. Selectable geometric forms: square, circle, hexagon.
5. Selectable style modes: single-shape, intensity-banded, seeded-random.
6. Selectable mapping modes: density, stroke, hybrid.
7. A4/Letter page size with configurable margins.
8. Composite preview plus one-SVG-per-layer export for sequential plotting.

## Run Locally

Open [index.html](index.html) directly in a browser. The app has no build step, no package install, no backend, and no local server requirement.

This is intended to work after cloning the repo and opening the file from disk, as well as when hosted on GitHub Pages.

## Layered Workflow

- Configure `1` active layer for the current single-color plotting workflow.
- Add more active layers to separate the source image into multiple pen/color passes.
- Each layer exports as its own SVG file so you can plot layers one at a time and swap pens between passes.

## Files

- `index.html`: App shell and controls UI.
- `shapes.js`: Shape registry loaded before the main app script.
- `tools.js`: Tool profile registry for plotter-friendly stroke behavior.
- `shapes/`: Normalized SVG assets for built-in shapes.
- `styles.css`: Visual design and responsive layout.
- `app.js`: Image processing, layer assignment, geometry mapping, preview, and SVG export pipeline.
- `docs/spec.md`: Product specification for v1.
