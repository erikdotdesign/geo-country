import { cleanSvgPathData, splitIntoSubpaths } from "./helpers";

figma.showUI(__html__, { themeColors: true, width: 350, height: 526 + 64 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-shape") {
    const subpaths = splitIntoSubpaths(msg.pathData);

    const vectors = subpaths.map(subpath => {
      const vector = figma.createVector();
      vector.vectorPaths = [{
        windingRule: 'EVENODD',
        data: cleanSvgPathData(subpath)
      }];
      vector.fills = [{type: "SOLID", color: {r: 0, g: 0, b: 0}}];
      vector.strokes = [];
      return vector;
    });

    const group = figma.group(vectors, figma.currentPage);
    figma.viewport.scrollAndZoomIntoView([group]);
  }
  figma.closePlugin();
};