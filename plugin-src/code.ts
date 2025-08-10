import { cleanSvgPathData, splitIntoSubpaths, getGeoFill } from "./helpers";

figma.showUI(__html__, { themeColors: true, width: 350, height: 542 + 64 });

const createPathDataGroup = (name: string, pathDataGroups: { name: string; pathData: string }[]): GroupNode => {
  const groups = pathDataGroups.map((g) => {
    const bgPaint = figma.currentPage.backgrounds?.[0] as SolidPaint;
    const subpaths = splitIntoSubpaths(g.pathData);

    const vectors = subpaths.map(subpath => {
      const vector = figma.createVector();
      vector.vectorPaths = [{
        windingRule: 'NONZERO',
        data: cleanSvgPathData(subpath)
      }];
      vector.fills = [{type: "SOLID", color: getGeoFill()}];
      vector.strokes = [{type: "SOLID", color: bgPaint.color}];
      vector.strokeWeight = 0.5;
      return vector;
    });

    const pathDataGroup = figma.group(vectors, figma.currentPage);
    pathDataGroup.name = g.name;
    
    return pathDataGroup;
  });

  const group = figma.group(groups, figma.currentPage);
  group.name = name;

  return group;
};

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-country") {
    const { continentPathData, countryPathData } = msg.pathData;
    const groups = [];
    
    if (continentPathData.length > 0) {
      const continentGroup = createPathDataGroup("continents", continentPathData.reverse());
      groups.push(continentGroup);
    } 
    if (Object.keys(countryPathData).length > 0) {
      const continentCountryGroups: GroupNode[] = [];
      Object.keys(countryPathData).sort((a, b) => a.localeCompare(b)).reverse().forEach((key) => {
        const continentGroup = createPathDataGroup(key, countryPathData[key].reverse())
        continentCountryGroups.push(continentGroup);
      });
      const countriesGroup = figma.group(continentCountryGroups, figma.currentPage);
      countriesGroup.name = "countries";
      groups.push(countriesGroup);
    } 

    const group = figma.group(groups, figma.currentPage);
    group.name = "geo-country";

    group.x = figma.viewport.center.x - group.width / 2;
    group.y = figma.viewport.center.y - group.height / 2;
  }
  figma.closePlugin();
};