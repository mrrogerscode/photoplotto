(function () {
  const shapes = [
    {
      id: "square",
      label: "Square",
      assetPath: "shapes/square.svg",
      markup: '<rect x="-0.5" y="-0.5" width="1" height="1" rx="0" ry="0"/>'
    },
    {
      id: "circle",
      label: "Circle",
      assetPath: "shapes/circle.svg",
      markup: '<circle cx="0" cy="0" r="0.5"/>'
    },
    {
      id: "hexagon",
      label: "Hexagon",
      assetPath: "shapes/hexagon.svg",
      markup: '<polygon points="0.476,-0.275 0, -0.55 -0.476,-0.275 -0.476,0.275 0,0.55 0.476,0.275"/>'
    }
  ];

  window.PhotoPlottoShapes = shapes;
})();