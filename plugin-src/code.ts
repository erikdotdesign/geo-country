import { cleanSvgPathData, splitIntoSubpaths, getGeoFill } from "./helpers";

figma.showUI(__html__, { themeColors: true, width: 350, height: 550 + 64 });

const createPathDataGroup = (name: string, pathData: {name: string; pathData: string}[]): GroupNode => {

  const groups = pathData.map((data) => {
    const bgPaint = figma.currentPage.backgrounds?.[0] as SolidPaint;
    const subpaths = splitIntoSubpaths(data.pathData);

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

    const dataGroup = figma.group(vectors, figma.currentPage);
    dataGroup.name = data.name;
    
    return dataGroup;
  });

  const group = figma.group(groups, figma.currentPage);
  group.name = name;

  return group;
};

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-shape") {
    const { continentPathData, countryPathData } = msg.pathData;
    const groups = [];
    
    if (continentPathData.length > 0) {
      const continentGroup = createPathDataGroup("continents", continentPathData);
      groups.push(continentGroup);
    } 
    if (Object.keys(countryPathData).length > 0) {
      const countryContinentGroups: GroupNode[] = [];
      Object.keys(countryPathData).forEach((key) => {
        const continentGroup = createPathDataGroup(key, countryPathData[key])
        countryContinentGroups.push(continentGroup);
      });
      const countryGroup = figma.group(countryContinentGroups, figma.currentPage);
      countryGroup.name = "countries";
      groups.push(countryGroup);
    } 

    const group = figma.group(groups, figma.currentPage);
    group.name = "geo-shape";

    group.x = figma.viewport.center.x - group.width / 2;
    group.y = figma.viewport.center.y - group.height / 2;
  }
  figma.closePlugin();
};