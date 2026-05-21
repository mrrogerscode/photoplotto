(function () {
  const shapes = [
    {
      id: "square",
      label: "Square",
      assetPath: "shapes/square.svg",
      markup: '<rect x="-0.5" y="-0.5" width="1" height="1" rx="0" ry="0"/>',
      moodIds: ["technical", "architectural"]
    },
    {
      id: "circle",
      label: "Circle",
      assetPath: "shapes/circle.svg",
      markup: '<circle cx="0" cy="0" r="0.5"/>',
      moodIds: ["playful", "organic"]
    },
    {
      id: "hexagon",
      label: "Hexagon",
      assetPath: "shapes/hexagon.svg",
      markup: '<polygon points="0.476,-0.275 0, -0.55 -0.476,-0.275 -0.476,0.275 0,0.55 0.476,0.275"/>',
      moodIds: ["architectural", "playful", "organic"]
    },
    {
      id: "triangle",
      label: "Triangle",
      assetPath: "shapes/triangle.svg",
      markup: '<polygon points="0,-0.58 0.56,0.42 -0.56,0.42"/>',
      moodIds: ["architectural", "playful", "organic"]
    },
    {
      id: "diamond",
      label: "Diamond",
      assetPath: "shapes/diamond.svg",
      markup: '<polygon points="0,-0.58 0.58,0 0,0.58 -0.58,0"/>',
      moodIds: ["technical", "architectural", "playful", "organic"]
    },
    {
      id: "ring",
      label: "Ring",
      assetPath: "shapes/ring.svg",
      markup: '<circle cx="0" cy="0" r="0.48"/><circle cx="0" cy="0" r="0.22"/>',
      moodIds: ["technical", "playful", "organic"]
    },
    {
      id: "plus",
      label: "Plus",
      assetPath: "shapes/plus.svg",
      markup: '<path d="M -0.5 0 H 0.5 M 0 -0.5 V 0.5"/>',
      moodIds: ["technical", "playful"]
    },
    {
      id: "line",
      label: "Line",
      assetPath: "shapes/line.svg",
      markup: '<line x1="-0.55" y1="0" x2="0.55" y2="0"/>',
      moodIds: ["technical", "architectural", "organic"]
    },
    {
      id: "octagon",
      label: "Octagon",
      assetPath: "shapes/octagon.svg",
      markup: '<polygon points="0.21,-0.55 0.55,-0.21 0.55,0.21 0.21,0.55 -0.21,0.55 -0.55,0.21 -0.55,-0.21 -0.21,-0.55"/>',
      moodIds: ["technical", "architectural"]
    }
  ];

  const moods = [
    {
      id: "technical",
      label: "Technical",
      description: "Precise, diagram-like forms with crisp texture and strong contrast.",
      enabledShapeIds: ["square", "diamond", "plus", "line", "ring", "octagon"],
      defaults: {
        singleShape: "octagon",
        bandDark: "plus",
        bandMid: "diamond",
        bandLight: "ring"
      }
    },
    {
      id: "architectural",
      label: "Architectural",
      description: "Faceted, structural geometry with strong edges and constructed rhythms.",
      enabledShapeIds: ["square", "triangle", "diamond", "hexagon", "line", "octagon"],
      defaults: {
        singleShape: "octagon",
        bandDark: "square",
        bandMid: "hexagon",
        bandLight: "triangle"
      }
    },
    {
      id: "playful",
      label: "Playful",
      description: "Friendly, energetic forms that keep the composition lively and open.",
      enabledShapeIds: ["circle", "triangle", "diamond", "ring", "plus", "hexagon"],
      defaults: {
        singleShape: "hexagon",
        bandDark: "diamond",
        bandMid: "circle",
        bandLight: "ring"
      }
    },
    {
      id: "organic",
      label: "Organic",
      description: "Softer silhouettes and open contours for gentler, more flowing drawings.",
      enabledShapeIds: ["circle", "triangle", "diamond", "ring", "line", "hexagon"],
      defaults: {
        singleShape: "circle",
        bandDark: "diamond",
        bandMid: "circle",
        bandLight: "ring"
      }
    }
  ];

  window.PhotoPlottoShapes = shapes;
  window.PhotoPlottoShapeMoods = moods;
})();