import { useState, useEffect } from "react";
import { continents, TContinentCode } from "countries-list";
import { feature, merge } from "topojson-client";
import countries50m from "world-atlas/countries-50m.json";
import countries110m from "world-atlas/countries-110m.json";
import { Topology, GeometryCollection } from "topojson-specification";
import type { Feature } from "geojson";
import { getPathGenerator, getCountryContinentCode, getRelPathData, patchId } from "./helpers";
import Select from "./Select";
import Button from "./Button";
import Control from "./Control";
import "./App.css";

const TOPO_JSON: any = { countries50m, countries110m };

const App = () => {
  const [dataSet, setDataSet] = useState("countries110m");
  const [countryFeatures, setCountryFeatures] = useState<Feature[]>([]);
  const [countryGeometries, setCountryGeometries] = useState<GeometryCollection[]>([]);
  const [continent, setContinent] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState<{ id: string; name: string; continent: TContinentCode }[]>([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(true);
  const [continentPathData, setContinentPathData] = useState<{name: string; pathData: string}[]>([]);
  const [countryPathData, setCountryPathData] = useState<
    Record<string, { name: string; pathData: string }[]>
  >({});

  const getPatchedCountryFeatures = (json: Topology<{ countries: GeometryCollection }>) => {
    const countryFeatures = feature(json, json.objects.countries);
    return countryFeatures.features.map(patchId);
  };
  
  const getPatchedCountryGeometries = (json: Topology<{ countries: GeometryCollection }>) => {
    return json.objects.countries.geometries.map(patchId);
  };

  const getGeometriesByContinent = (continentCode?: string) =>
    countryGeometries.filter((geom) => 
      continentCode ? getCountryContinentCode(geom.id as string) === continentCode : true
    );

  const getContinentGeometryMap = () => {
    return Object.keys(continents).reduce((acc, code) => {
      acc[code] = {
        type: "Feature",
        properties: { name: continents[code as TContinentCode] },
        geometry: merge(TOPO_JSON[dataSet], getGeometriesByContinent(code) as any)
      };
      return acc;
    }, {} as Record<string, Feature>);
  };

  const getCountryFeatures = (countryCode: string): Feature | undefined => 
    countryFeatures.find((c: any) => c.id === countryCode);

  const getCountryFeaturesByContinent = (continentCode?: string) => {
    if (continentCode) {
      return countryFeatures.filter(f => 
        getCountryContinentCode(f.id as string) === continentCode
      );
    } else {
      return countryFeatures;
    }
  };

  const handleNewDataSet = (ds: any) => {
    const newDataSet = TOPO_JSON[ds];
    const newCountryFeatures = getPatchedCountryFeatures(newDataSet);
    const newCountryGeometries = getPatchedCountryGeometries(newDataSet);
    const newCountryList = newCountryFeatures.map((c) => ({
      id: c.id as string,
      name: (c.properties as any).name || "Unnamed",
      continent: getCountryContinentCode(c.id as string)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
    if (!newCountryList.find((c) => c.id === country)) {
      setCountry("");
    }
    setCountries(newCountryList);
    setCountryFeatures(newCountryFeatures);
    setCountryGeometries(newCountryGeometries);
    setDataSet(ds);
  };

  // Load plugin cache
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-storage", key: "cache" } }, "*");
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "storage-loaded") {
        if (msg.key === "cache" && msg.value) {
          setDataSet(msg.value.dataSet);
          setContinent(msg.value.continent);
          setCountry(msg.value.country);
          setIncludeCountryBorders(msg.value.includeCountryBorders);
        }
      }
    };
  }, []);

  // Handle updating data set
  useEffect(() => {
    handleNewDataSet(dataSet);
  }, [dataSet]);

  // Handle updating path data
  useEffect(() => {
    if (!countryFeatures.length || !countryGeometries.length) return;
    if (country) {
      if (continentPathData.length) setContinentPathData([]);
      const projectionFeatures = getCountryFeatures(country) as Feature;
      const pathGenerator = getPathGenerator(projectionFeatures);
      const continentName = continents[continent as TContinentCode];
      setCountryPathData({
        [continentName]: [{
          name: (projectionFeatures.properties as any).name,
          pathData: getRelPathData(pathGenerator, projectionFeatures)
        }]
      });
    } else {
      const continentGeometryMap = getContinentGeometryMap();
      const projectionFeatures = continent ? [continentGeometryMap[continent]] : Object.values(continentGeometryMap);
      const pathGenerator = getPathGenerator(projectionFeatures);

      setContinentPathData(projectionFeatures.map((pf, i) => ({
        name: (pf.properties as any).name,
        pathData: getRelPathData(pathGenerator, projectionFeatures[i])
      })));

      if (includeCountryBorders) {
        const continentCountryFeatures = getCountryFeaturesByContinent(continent);

        // Group countries by continent name
        const groupedByContinent = continentCountryFeatures.reduce((acc, countryFeature) => {
          const continentCode = getCountryContinentCode(countryFeature.id as string);
          const continentName = continents[continentCode];
          const pathData = getRelPathData(pathGenerator, countryFeature) as string;
          // Only add countries with have valid pathData
          if (pathData) {
            if (!acc[continentName]) acc[continentName] = [];
            acc[continentName].push({
              name: (countryFeature.properties as any).name,
              pathData
            });
          }
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
    parent.postMessage({
      pluginMessage: { type: "save-storage", key: "cache", value: {
        dataSet,
        continent,
        country,
        includeCountryBorders
      }},
    }, "*");
  }, [continent, country, includeCountryBorders, dataSet, countryFeatures, countryGeometries]);

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

  const handleSetDataSet = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleNewDataSet(e.target.value);
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
        <Select
          label="Detail"
          value={dataSet}
          onChange={handleSetDataSet}>
          <option 
            key={"countries110m"}
            value={"countries110m"}>
            {`Low (1:110m scale)`}
          </option>
          <option 
            key={"countries50m"}
            value={"countries50m"}>
            {`High (1:50m scale)`}
          </option>
        </Select>
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
              label="Include countries"
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