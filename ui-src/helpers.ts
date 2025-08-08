import * as d3 from "d3-geo";
import { geoPath, geoGraticule } from "d3-geo";

export const getPathData = (features, projectionType) => {
  const collection = { type: "FeatureCollection", features };
  const projection = d3[projectionType]().fitSize([302, 302], collection);
  const path = geoPath(projection);
  return path(collection);
};

export const getGraticulePathData = (projectionType) => {
  const graticule = geoGraticule();

  // Create a projection *without* fitSize, with fixed scale and translate
  const projection = d3[projectionType]()
    .scale(150)               // example scale; adjust to your svg size
    .translate([151, 151]);   // half of your 302x302 SVG size

  const pathGenerator = geoPath(projection);

  return pathGenerator(graticule());
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};