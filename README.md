# PhotoPlotto

PhotoPlotto is a browser-only static app that converts images into layered geometric SVG artwork designed for pen plotting.

Repository: <https://github.com/mrrogerscode/photoplotto.git>

## Current Prototype

Implemented in this initial pass:

1. Upload PNG/JPEG/WebP images.
2. One to four ordered plotting layers, each with its own pen profile and color.
3. Grayscale conversion with invert, contrast, and gamma controls for geometry generation.
4. Expanded geometric library including square, circle, hexagon, triangle, diamond, ring, plus, line, and octagon.
5. Shape-language moods that preset curated families such as technical, architectural, playful, and organic.
6. Selectable style modes: single-shape, intensity-banded, seeded-random.
7. Selectable mapping modes: density, stroke, hybrid.
8. A4/Letter page size with configurable margins.
9. Composite preview plus one-SVG-per-layer export for sequential plotting.

## Run Locally

Open [index.html](index.html) directly in a browser. The app has no build step, no package install, no backend, and no local server requirement.

This is intended to work after cloning the repo and opening the file from disk, as well as when hosted on GitHub Pages.

## Layered Workflow

- Configure `1` active layer for the current single-color plotting workflow.
- Add more active layers to separate the source image into multiple pen/color passes.
- Each layer exports as its own SVG file so you can plot layers one at a time and swap pens between passes.

## Shape Moods

- Choose a `Mood` in Shape Language to seed a curated family of forms.
- Fine-tune the random-shape checklist or banded shape assignments after the mood preset is applied.
- Current moods: `Technical`, `Architectural`, `Playful`, and `Organic`.

## Files

- `index.html`: App shell and controls UI.
- `shapes.js`: Shape registry loaded before the main app script.
- `tools.js`: Tool profile registry for plotter-friendly stroke behavior.
- `shapes/`: Normalized SVG assets for built-in shapes.
- `styles.css`: Visual design and responsive layout.
- `app.js`: Image processing, layer assignment, geometry mapping, preview, and SVG export pipeline.
- `docs/spec.md`: Product specification for v1.
