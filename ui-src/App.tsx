import { useState, useEffect } from "react";
import { continents, TContinentCode } from "countries-list";
import { feature, merge } from "topojson-client";
import countriesTopoJSON from "world-atlas/countries-50m.json";
import { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature } from "geojson";
import { getPathGenerator, getCountryContinentCode, getRelPathData, filterFarPolygons } from "./helpers";
import Select from "./Select";
import Button from "./Button";
import Control from "./Control";
import "./App.css";

const App = () => {
  const [continent, setContinent] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState<{ id: string; name: string; continent: TContinentCode }[]>([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(false);
  const [continentPathData, setContinentPathData] = useState<{name: string; pathData: string}[]>([]);
  const [countryPathData, setCountryPathData] = useState<
    Record<string, { name: string; pathData: string }[]>
  >({});

  const topology = countriesTopoJSON as unknown as Topology<{ countries: GeometryCollection }>;
  const countryFeatures: FeatureCollection = feature(topology, topology.objects.countries);
  const patchedCountryFeatures = countryFeatures.features.map(f => {
    if (!f.id) {
      if ((f.properties as any).name === "Kosovo") f.id = "XK";
      if ((f.properties as any).name === "Somaliland") f.id = "XS";
      if ((f.properties as any).name === "N. Cyprus") f.id = "XN";
      if ((f.properties as any).name === "Siachen Glacier") f.id = "XZ";
      if ((f.properties as any).name === "Indian Ocean Ter.") f.id = "XI";
    } else if ((f.properties as any).name === "Ashmore and Cartier Is.") {
      f.id = "AX";
    }
    return f;
  });

  const getGeometriesByContinent = (continentCode?: string) =>
    topology.objects.countries.geometries.filter((geom) => 
      continentCode ? getCountryContinentCode(geom.id as string) === continentCode : true
    );

  const continentGeometryMap: Record<string, Feature> = 
    Object.keys(continents).reduce((acc, code) => {
      acc[code] = {
        type: "Feature",
        properties: { name: continents[code as TContinentCode] },
        geometry: merge(topology, getGeometriesByContinent(code) as any)
      };
      return acc;
    }, {} as Record<string, Feature>);

  const getCountryFeatures = (countryCode: string): Feature | undefined => 
    patchedCountryFeatures.find((c: any) => c.id === countryCode);

  const getCountryFeaturesByContinent = (continentCode?: string) => {
    if (continentCode) {
      return patchedCountryFeatures.filter(f => 
        getCountryContinentCode(f.id as string) === continentCode
      );
    } else {
      return patchedCountryFeatures;
    }
  };

  // Build country list for selectors
  useEffect(() => {
    setCountries(
      patchedCountryFeatures.map((c) => ({
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
      if (continentPathData.length) setContinentPathData([]);
      const projectionFeatures = getCountryFeatures(country) as Feature;
      const filtered = filterFarPolygons([projectionFeatures]) as FeatureCollection;
      const pathGenerator = getPathGenerator(filtered.features);
      const continentName = continents[continent as TContinentCode];
      setCountryPathData({
        [continentName]: [{
          name: (projectionFeatures.properties as any).name,
          pathData: getRelPathData(pathGenerator, projectionFeatures)
        }]
      });
    } else {
      const projectionFeatures = continent ? [continentGeometryMap[continent]] : Object.values(continentGeometryMap);
      const filtered = filterFarPolygons(projectionFeatures) as FeatureCollection;
      const pathGenerator = getPathGenerator(filtered.features);

      setContinentPathData(filtered.features.map((pf, i) => ({
        name: (pf.properties as any).name,
        pathData: getRelPathData(pathGenerator, projectionFeatures[i])
      })));

      if (includeCountryBorders) {
        const countryFeatures = getCountryFeaturesByContinent(continent);

        // Group countries by continent name
        const groupedByContinent = countryFeatures.reduce((acc, countryFeature) => {
          const continentCode = getCountryContinentCode(countryFeature.id as string);
          const continentName = continents[continentCode];
          if (!acc[continentName]) acc[continentName] = [];
          acc[continentName].push({
            name: (countryFeature.properties as any).name,
            pathData: getRelPathData(pathGenerator, countryFeature) as string,
          });
          return acc;
        }, {} as Record<string, { name: string; pathData: string }[]>);

        // Sort each continent group alphabetically by country name
        for (const continentName in groupedByContinent) {
          groupedByContinent[continentName].sort((a, b) => a.name.localeCompare(b.name));
        }

        setCountryPathData(groupedByContinent);
      } else {
        setCountryPathData({});
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
            type: "create-geo-country", 
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
        <div className="c-app__geo-preview">
          <svg>
            {
              continentPathData.map((v) => (
                <path d={v.pathData} />
              ))
            }
          </svg>
          <svg>
            {Object.entries(countryPathData).map(([continentCode, countries]) => (
              <g key={continentCode}>
                {countries.map((v) => (
                  <path key={v.name} d={v.pathData} />
                ))}
              </g>
            ))}
          </svg>
        </div>
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