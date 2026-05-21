(function () {
  const tools = [
    {
      id: "005-liner",
      label: "0.05 Technical Pen",
      tipWidthMm: 0.05,
      minStrokeMm: 0.08,
      maxStrokeMm: 0.22,
      recommendedCellSizeMm: 1.5,
      notes: "Best for dense detail and light line variation."
    },
    {
      id: "01-liner",
      label: "0.1 Fineliner",
      tipWidthMm: 0.1,
      minStrokeMm: 0.12,
      maxStrokeMm: 0.35,
      recommendedCellSizeMm: 2,
      notes: "Balanced default for most sketch-like outputs."
    },
    {
      id: "03-liner",
      label: "0.3 Fineliner",
      tipWidthMm: 0.3,
      minStrokeMm: 0.3,
      maxStrokeMm: 0.6,
      recommendedCellSizeMm: 3,
      notes: "Works better with larger cells and bolder marks."
    },
    {
      id: "05-liner",
      label: "0.5 Fineliner",
      tipWidthMm: 0.5,
      minStrokeMm: 0.5,
      maxStrokeMm: 0.85,
      recommendedCellSizeMm: 4,
      notes: "Good for bold linework and more open compositions."
    },
    {
      id: "07-liner",
      label: "0.7 Fineliner",
      tipWidthMm: 0.7,
      minStrokeMm: 0.7,
      maxStrokeMm: 1.1,
      recommendedCellSizeMm: 5,
      notes: "Suited to larger cells and lower-density plotting."
    },
    {
      id: "10-liner",
      label: "1.0 Marker Pen",
      tipWidthMm: 1,
      minStrokeMm: 1,
      maxStrokeMm: 1.4,
      recommendedCellSizeMm: 6,
      notes: "Use for poster-like output with broad, high-visibility marks."
    },
    {
      id: "bic-ballpoint-medium",
      label: "BIC Ballpoint 1.0",
      tipWidthMm: 1,
      minStrokeMm: 0.3,
      maxStrokeMm: 0.45,
      recommendedCellSizeMm: 3.5,
      notes: "Typical 1.0mm ballpoint tip with a narrower drawn line than felt-tip or marker pens."
    },
    {
      id: "brush-fine",
      label: "Fine Brush Pen",
      tipWidthMm: 0.4,
      minStrokeMm: 0.35,
      maxStrokeMm: 0.9,
      recommendedCellSizeMm: 4,
      notes: "Use for expressive output with fewer, heavier strokes."
    }
  ];

  window.PhotoPlottoTools = tools;
})();