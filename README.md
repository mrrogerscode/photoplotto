# PhotoPlotto

PhotoPlotto is a browser-only static app that converts images into geometric SVG artwork designed for pen plotting.

Repository: https://github.com/mrrogerscode/photoplotto.git

## Current Prototype

Implemented in this initial pass:

1. Upload PNG/JPEG/WebP images.
2. Grayscale conversion with invert, contrast, and gamma controls.
3. Selectable geometric forms: square, circle, hexagon.
4. Selectable style modes: single-shape, intensity-banded, seeded-random.
5. Selectable mapping modes: density, stroke, hybrid.
6. A4/Letter page size with configurable margins.
7. SVG preview and export.

## Run Locally

Open [index.html](index.html) directly in a browser. The app has no build step, no package install, no backend, and no local server requirement.

This is intended to work after cloning the repo and opening the file from disk, as well as when hosted on GitHub Pages.

## Files

- `index.html`: App shell and controls UI.
- `shapes.js`: Shape registry loaded before the main app script.
- `tools.js`: Tool profile registry for plotter-friendly stroke behavior.
- `shapes/`: Normalized SVG assets for built-in shapes.
- `styles.css`: Visual design and responsive layout.
- `app.js`: Image processing, geometry mapping, and SVG generation pipeline.
- `docs/spec.md`: Product specification for v1.
