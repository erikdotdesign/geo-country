figma.showUI(__html__, { themeColors: true, width: 350, height: 520 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-shape") {
    const vector = figma.createVector();
    vector.vectorPaths = [{
      data: msg.pathData,
      windingRule: 'NONZERO',
    }];
    vector.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 0.9 } }];
    vector.resize(300, 300);
    figma.currentPage.appendChild(vector);
    figma.viewport.scrollAndZoomIntoView([vector]);
  }
  figma.closePlugin();
};