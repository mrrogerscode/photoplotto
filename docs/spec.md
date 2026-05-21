# PhotoPlotto v1 Specification

## 1. Problem Statement

PhotoPlotto converts raster images into grayscale-driven geometric SVG art suitable for pen plotters, in a single browser-only workflow.

Canonical repository: https://github.com/mrrogerscode/photoplotto.git

## 2. Goals

1. Accept user images and convert to grayscale intensity.
2. Render SVG using selectable forms: square, circle, hexagon.
3. Let users choose intensity mapping behavior:
   - Density
   - Stroke
   - Hybrid
4. Support A4/Letter page presets and configurable margins.
5. Produce deterministic output using a seed.
6. Keep output plotter-friendly by default.
7. Run by opening [index.html](../index.html) directly from disk after cloning the repo.
8. Run unchanged when hosted on GitHub Pages.

## 3. Non-Goals

1. Backend or cloud rendering.
2. Direct plotter control.
3. G-code export.
4. Multi-pen color separation.
5. Required local development server.
6. Required JavaScript package installation or build tooling.

## 4. User Stories

1. Upload an image and preview grayscale conversion.
2. Choose geometric form style and intensity mapping style.
3. Tune cell size, contrast, gamma, and invert settings.
4. Set page size and margin for export.
5. Export deterministic SVG output.
6. Clone the repo and open [index.html](../index.html) without installing anything.

## 5. Functional Requirements

### 5.1 Input

1. Supported formats: PNG, JPEG, WebP.
2. Validate upload type.
3. Downscale very large images to maintain responsiveness.

### 5.2 Grayscale Preprocessing

1. Use luminance-based conversion.
2. Normalize intensity to [0,1].
3. Apply optional invert.
4. Apply contrast and gamma controls.

### 5.3 Sampling

1. Partition drawing region into a configurable cell grid (mm-based cell size).
2. Compute representative intensity per cell.

### 5.4 Style Modes

1. Single-shape mode.
2. Intensity-band mode (dark/mid/light selectors).
3. Seeded-random shape mode from enabled shapes.

### 5.5 Mapping Modes

1. Density mode:
   - Darker pixels increase geometry count.
2. Stroke mode:
   - Darker pixels increase stroke intensity.
3. Hybrid mode:
   - Both density and stroke intensity vary by darkness.

### 5.6 SVG Export

1. Export standards-compliant SVG.
2. Use physical dimensions in mm.
3. Support A4 and Letter page sizes.
4. Apply user-configured margin as printable clip region.
5. Default to stroke-first primitive output.

### 5.7 Deployment and Runtime

1. The app must be plain browser JavaScript, HTML, and CSS.
2. The app must not depend on Node, Python, npm, package managers, bundlers, or local servers at runtime.
3. [index.html](../index.html) must load app behavior with a classic script tag compatible with direct file opening.
4. Relative asset paths must work both from disk and from GitHub Pages.

## 6. Non-Functional Requirements

1. Fully client-side execution.
2. No build step, package install, backend, or local server is required.
3. Opening [index.html](../index.html) directly from disk must run the app.
4. Hosting on GitHub Pages must run the same files without special configuration.
5. Modern browser support.
6. Responsive layout for desktop and tablet.
7. Deterministic output for identical image/settings/seed.

## 7. Acceptance Criteria

1. Supported images load successfully.
2. Grayscale preview updates when preprocessing controls change.
3. Style and mapping controls alter output without re-upload.
4. Exported SVG reflects selected page size and margin.
5. Same seed and settings produce equivalent output structure.
6. The app runs when [index.html](../index.html) is opened directly from a cloned repo.
7. The app runs from GitHub Pages without code changes.

## 8. Risks and Mitigation

1. High path counts can increase plotting time:
   - Mitigate with user-adjustable cell size and density strength.
2. Large images can degrade browser performance:
   - Mitigate with automatic downscaling.
3. Browser differences for local file access can affect advanced APIs:
   - Mitigate by using standard file input, canvas, Blob downloads, and classic script loading.

## 9. Milestones

1. M1: Upload, grayscale, SVG export pipeline.
2. M2: Selectable style and mapping modes.
3. M3: Page/margin controls and deterministic seed behavior.
4. M4: Direct-file-open validation, GitHub Pages validation, and UX polish.
