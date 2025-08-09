import * as d3 from "d3-geo";
import type { FeatureCollection, Feature } from "geojson";
import { geoPath, geoMercator } from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { getCountryData, TCountryCode } from "countries-list";

export const getPathGenerator = (
  features: Feature | Feature[]
) => {
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: normalizedFeatures
  };
  const projection = geoMercator().fitSize([302, 302], collection);
  return geoPath(projection);
};

export const getRelPathData = (
  pathGenerator: any,
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
  const alpha2 = isoCountries.numericToAlpha2(id) as TCountryCode;
  return getCountryData(alpha2).continent;
};