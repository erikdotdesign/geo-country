import { cleanSvgPathData, splitIntoSubpaths, getGeoFill, getTargetBounds, scaleAndPositionGroup, adjustStrokeWeights } from "./helpers";

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
      vector.lockAspectRatio();
      return vector;
    });

    const pathDataGroup = figma.group(vectors, figma.currentPage);
    pathDataGroup.lockAspectRatio();
    pathDataGroup.name = g.name;
    
    return pathDataGroup;
  });

  const group = figma.group(groups, figma.currentPage);
  group.lockAspectRatio();
  group.name = name;

  return group;
};

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'save-storage') {
    await figma.clientStorage.setAsync(msg.key, msg.value);
  }
  if (msg.type === 'load-storage') {
    const value = await figma.clientStorage.getAsync(msg.key);
    figma.ui.postMessage({ type: 'storage-loaded', key: msg.key, value });
  }
  if (msg.type === "create-geo-country") {
    const { continentPathData, countryPathData } = msg.pathData;
    const groups = [];
    
    if (continentPathData.length > 0) {
      const continentGroup = createPathDataGroup("Continents", continentPathData.reverse());
      groups.push(continentGroup);
    } 
    if (Object.keys(countryPathData).length > 0) {
      const continentCountryGroups: GroupNode[] = [];
      Object.keys(countryPathData).sort((a, b) => a.localeCompare(b)).reverse().forEach((key) => {
        const continentGroup = createPathDataGroup(key, countryPathData[key].reverse())
        continentCountryGroups.push(continentGroup);
      });
      const countriesGroup = figma.group(continentCountryGroups, figma.currentPage);
      countriesGroup.name = "Countries";
      countriesGroup.lockAspectRatio();
      groups.push(countriesGroup);
    } 

    const group = figma.group(groups, figma.currentPage);
    group.lockAspectRatio();
    group.name = "Geo-Country";

    // 1. get bounds
    const targetBounds = getTargetBounds();

    // 2. scale & position group to selection or viewport size (80%)
    const scale = scaleAndPositionGroup(group, targetBounds as any);

    // 3. dynamically adjust stroke weight based on scale
    adjustStrokeWeights(group, 0.5, scale);

    // 4. select final group
    figma.currentPage.selection = [group];

    figma.closePlugin();
  }
};