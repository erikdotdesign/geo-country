import { useState, useEffect } from "react";
import * as d3 from "d3-geo";
import { continents, TContinentCode } from "countries-list";
import { feature, merge } from "topojson-client";
import countriesTopoJSON from "world-atlas/countries-110m.json";
import { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry, GeoJsonProperties, Feature } from "geojson";
import { getPathData, getCountryContinentCode } from "./helpers";
import Select from "./Select";
import Button from "./Button";
import Control from "./Control";
import GeoPreview from "./GeoPreview";
import "./App.css";

const App = () => {
  const [continent, setContinent] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState<{ id: string; name: string; continent: TContinentCode }[]>([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(false);
  const [continentPathData, setContinentPathData] = useState<string | null>(null);
  const [countryPathData, setCountryPathData] = useState<string | null>(null);

  const topology = countriesTopoJSON as unknown as Topology<{ countries: GeometryCollection }>;
  const countryFeatures: FeatureCollection = 
    feature(topology, topology.objects.countries);

  const mergeGeometries = (geometries: any[]) =>
    merge(topology, geometries);

  const getGeometriesByContinent = (continentCode?: string) =>
    topology.objects.countries.geometries.filter((geom) => 
      continentCode ? getCountryContinentCode(geom.id as string) === continentCode : true
    );

  const continentGeometries: Feature[] = Object.keys(continents).map((code) => ({
    type: "Feature",
    properties: { name: code },
    geometry: mergeGeometries(getGeometriesByContinent(code))
  }));

  const getContinentGeometry = (continentCode: string): Feature | undefined => 
    continentGeometries.find(c => (c.properties as any).name === continentCode);

  const getCountryGeometry = (countryCode: string): Feature | undefined => 
    countryFeatures.features.find((c: any) => c.id === countryCode);

  const getCountryBorders = (continentCode?: string) => {
    if (continentCode) {
      return countryFeatures.features.filter(f => 
        getCountryContinentCode(f.id as string) === continent
      );
    } else {
      return countryFeatures.features;
    }
  };

  // Build country list for selectors
  useEffect(() => {
    setCountries(
      countryFeatures.features.map((c) => ({
        id: c.id as string,
        name: (c.properties as any).name || "Unnamed",
        continent: getCountryContinentCode(c.id as string)
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    );
  }, []);

  // Handle updating path data
  useEffect(() => {
    if (country) {
      if (continentPathData) setContinentPathData("");
      const countryGeometry = getCountryGeometry(country) as Feature;
      setCountryPathData(getPathData(countryGeometry));
    } else {
      const geometry = continent ? getContinentGeometry(continent) as Feature : continentGeometries;
      setContinentPathData(getPathData(geometry));

      if (includeCountryBorders) {
        const countryBorders = getCountryBorders(continent);
        setCountryPathData(getPathData(countryBorders));
      } else {
        setCountryPathData("");
      }
    }
  }, [continent, country, includeCountryBorders]);

  const handleSetContinent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContinent(e.target.value);
    setCountry("");
  };

  const handleSetCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  const handleSetIncludeCountryBorders = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeCountryBorders(e.target.checked);
  };

  const createGeoShape = () => {
    const pathData = continentPathData || countryPathData;
    if (pathData) {
      parent.postMessage(
        { 
          pluginMessage: { 
            type: "create-geo-shape", 
            pathData: {
              continentPathData,
              countryPathData
            }
          } 
        },
        "*"
      );
    }
  };

  return (
    <main className="c-app">
      <section className="c-app__body">
        <div className="c-app__logo">
          geo-country
        </div>
        <div className="c-control-group">
          <Select
            label="Continent"
            value={continent}
            onChange={handleSetContinent}>
            <option value="">All continents</option>
            {
              Object.keys(continents).map((key) => (
                <option 
                  key={key}
                  value={key}>
                  {continents[key as TContinentCode] as string}
                </option>
              ))
            }
          </Select>
          {
            continent
            ? <Select
                label="Country"
                value={country}
                onChange={handleSetCountry}>
                <option value="">All countries</option>
                {
                  countries
                    .filter(c => c.continent === continent)
                    .map((country) => (
                      <option 
                        key={country.id}
                        value={country.id}>
                        {country.name}
                      </option>
                    ))
                }
              </Select>
            : null
          }
        </div>
        {
          !country
          ? <Control
              as="input"
              type="checkbox"
              label="Include country borders"
              checked={includeCountryBorders}
              onChange={handleSetIncludeCountryBorders} />
          : null
        }
        <GeoPreview
          continentPathData={continentPathData}
          countryPathData={countryPathData} />
      </section>
      <footer className="c-app__footer">
        <Button 
          type="primary"
          onClick={createGeoShape}>
          Add to document
        </Button>
      </footer>
    </main>
  );
}

export default App;