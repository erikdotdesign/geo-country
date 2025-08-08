import * as d3 from "d3-geo";
import { geoPath, geoMercator, geoAlbersUsa } from "d3-geo";

export const getPathData = (features, albers = false) => {
  const collection = { type: "FeatureCollection", features };
  const projection = (albers ? geoAlbersUsa() : geoMercator()).fitSize([302, 302], collection);
  const path = geoPath(projection);
  return path(collection);
};