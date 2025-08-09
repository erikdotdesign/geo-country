import { cleanSvgPathData, splitIntoSubpaths, getGeoFill } from "./helpers";

figma.showUI(__html__, { themeColors: true, width: 350, height: 550 + 64 });

const createPathDataGroup = (name: string, pathData: string) => {
  const bgPaint = figma.currentPage.backgrounds?.[0] as SolidPaint;
  const subpaths = splitIntoSubpaths(pathData);

  const vectors = subpaths.map(subpath => {
    const vector = figma.createVector();
    vector.vectorPaths = [{
      windingRule: 'NONZERO',
      data: cleanSvgPathData(subpath)
    }];
    vector.fills = [{type: "SOLID", color: getGeoFill()}];
    vector.strokes = [{type: "SOLID", color: bgPaint.color}];
    vector.strokeWeight = 1;
    return vector;
  });

  const group = figma.group(vectors, figma.currentPage);
  group.name = name;

  return group;
};

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-shape") {
    const { 
      continentPathData, countryPathData, 
      statePathData, countyPathData 
    } = msg.pathData;
    const groups = [];
    
    if (continentPathData) {
      const continentGroup = createPathDataGroup("continent", continentPathData);
      groups.push(continentGroup);
    } 
    if (countryPathData) {
      const countryGroup = createPathDataGroup("country", countryPathData);
      groups.push(countryGroup);
    } 
    if (statePathData) {
      const stateGroup = createPathDataGroup("state", statePathData);
      groups.push(stateGroup);
    } 
    if (countyPathData) {
      const countyGroup = createPathDataGroup("county", countyPathData);
      groups.push(countyGroup);
    }

    const group = figma.group(groups, figma.currentPage);
    group.name = "geo-shape";

    group.x = figma.viewport.center.x - group.width / 2;
    group.y = figma.viewport.center.y - group.height / 2;
  }
  figma.closePlugin();
};