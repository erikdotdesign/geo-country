import * as d3Geo from "d3-geo";
import type { FeatureCollection, Feature } from "geojson";
import { geoPath, geoMercator, GeoPath } from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { getCountryData, TCountryCode } from "countries-list";


export const filterFarPolygons = (features: Feature[], maxDistanceDeg = 40) => {
  return {
    type: "FeatureCollection",
    features: features
      .map((f) => {
        if (f.geometry.type === "Polygon") {
          return filterPolygonFeature(f, maxDistanceDeg);
        } else if (f.geometry.type === "MultiPolygon") {
          return filterMultiPolygonFeature(f, maxDistanceDeg);
        }
        return f;
      })
      .filter(Boolean),
  };
};

const filterPolygonFeature = (f: Feature, maxDistanceDeg: number) => {
  const mainCentroid = d3Geo.geoCentroid(f);
  return isWithinDistance(mainCentroid, mainCentroid, maxDistanceDeg) ? f : null;
};

const filterMultiPolygonFeature = (f: Feature, maxDistanceDeg: number) => {
  // Pick largest polygon by geodesic area
  const largest = (f.geometry as any).coordinates.reduce(
    (max: any, coords: any) => {
      const poly = { type: "Polygon", coordinates: coords } as any;
      const area = d3Geo.geoArea(poly); // in steradians
      return area > max.area ? { coords, area } : max;
    },
    { coords: null, area: 0 }
  ).coords;

  const mainCentroid = d3Geo.geoCentroid({ type: "Polygon", coordinates: largest });

  const filteredPolys = (f.geometry as any).coordinates.filter((coords: any) => {
    const polyCentroid = d3Geo.geoCentroid({ type: "Polygon", coordinates: coords });
    return isWithinDistance(mainCentroid, polyCentroid, maxDistanceDeg);
  });

  if (!filteredPolys.length) return null;

  return {
    ...f,
    geometry: { type: "MultiPolygon", coordinates: filteredPolys },
  };
};

const isWithinDistance = (c1: [number, number], c2: [number, number], maxDistDeg: number) => {
  const distDeg = d3Geo.geoDistance(c1, c2) * (180 / Math.PI);
  return distDeg <= maxDistDeg;
};

export const getPathGenerator = (features: Feature | Feature[]) => {
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: normalizedFeatures,
  };

  // Determine rotation angle to shift the "cut" line
  const firstFeature = normalizedFeatures[0] as any;
  const continentCode = getCountryContinentCode(firstFeature.id);

  let rotateLng = 0;

  if (
    firstFeature.properties.name === "Asia" ||
    firstFeature.properties.name === "Oceania" ||
    continentCode === "AS" ||
    continentCode === "OC"
  ) {
    rotateLng = -160; // Shift cut to Atlantic for Asia/Oceania
  } else if (
    firstFeature.properties.name === "North America" ||
    firstFeature.properties.name === "United States of America"
  ) {
    rotateLng = 160; // Shift cut to Atlantic for North America/USA
  }

  const projection = d3Geo
    .geoMercator()
    .rotate([rotateLng, 0])
    .fitSize([302, 302], collection);

  return d3Geo.geoPath(projection);
};

export const getRelPathData = (
  pathGenerator: GeoPath,
  features: Feature | Feature[]
): string => {
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: normalizedFeatures
  };
  return pathGenerator(featureCollection) as string;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getCountryContinentCode = (id: string) => {
  const customCountryContinentMap: Record<string, string> = {
    XK: "EU",
    XN: "AS",
    XS: "AF",
    XZ: "AS",
    XI: "EU",
    AX: "OC"
  };
  const alpha2 = isoCountries.numericToAlpha2(id) as TCountryCode;
  return getCountryData(alpha2).continent || customCountryContinentMap[id];
};

export const patchId = (obj: any) => {
  if (!obj.id) {
    switch (obj.properties.name) {
      case "Kosovo": obj.id = "XK"; break;
      case "Somaliland": obj.id = "XS"; break;
      case "N. Cyprus": obj.id = "XN"; break;
      case "Siachen Glacier": obj.id = "XZ"; break;
      case "Indian Ocean Ter.": obj.id = "XI"; break;
    }
  } else if (obj.properties.name === "Ashmore and Cartier Is.") {
    obj.id = "AX";
  }
  return obj;
};
