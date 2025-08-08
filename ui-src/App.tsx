import { useState, useEffect } from "react";
import * as d3 from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { continents, getCountryData } from "countries-list";
import { geoPath, geoMercator, geoAlbersUsa } from "d3-geo";
import { feature, merge } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import states10m from "us-atlas/states-10m.json";
import counties10m from "us-atlas/counties-10m.json";
import Select from "./Select";
import Button from "./Button";
import StateOptions from "./StateOptions";
import Control from "./Control";
import GeoPreview from "./GeoPreview";
import "./App.css";

const App = () => {
  const [pathData, setPathData] = useState<string | null>(null);
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState([]);
  const [state, setState] = useState<string>("");
  const [states, setStates] = useState([]);
  const [county, setCounty] = useState<string>("");
  const [counties, setCounties] = useState([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState(false);
  const [includeStateBorders, setIncludeStateBorders] = useState(false);
  const [includeCountyBorders, setIncludeCountyBorders] = useState(false);
  const [continentsPathData, setContinentsPathData] = useState<string | null>(null);
  const [continentPathData, setContinentPathData] = useState<string | null>(null);
  const [countriesPathData, setCountriesPathData] = useState<string | null>(null);
  const [countryPathData, setCountryPathData] = useState<string | null>(null);
  const [statesPathData, setStatesPathData] = useState<string | null>(null);
  const [statePathData, setStatePathData] = useState<string | null>(null);
  const [countiesPathData, setCountiesPathData] = useState<string | null>(null);
  const [countyPathData, setCountyPathData] = useState<string | null>(null);

  useEffect(() => {
    const countriesGeo = feature(countries110m as any, countries110m.objects.countries).features;
    const statesGeo = feature(states10m as any, states10m.objects.states).features;
    const countiesGeo = feature(counties10m as any, counties10m.objects.counties).features;
    const countryList = countriesGeo
      .map((c) => ({
        id: c.id,
        name: c.properties.name || "Unnamed",
        continent: getCountryData(isoCountries.numericToAlpha2(c.id)).continent
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const stateList = statesGeo
      .map((c) => ({
        id: c.id,
        name: c.properties.name || "Unnamed"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const countiesList = countiesGeo
      .map((c) => ({
        id: c.id,
        name: c.properties.name || "Unnamed"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setCountries(countryList);
    setStates(stateList);
    setCounties(countiesList);
    // fetch("https://ipapi.co/json/")
    //   .then(res => res.json())
    //   .then(data => {
    //     const userCountry = data.country_name?.toLowerCase();
    //     const countryMatch = countryList.find(c => c.name.toLowerCase().includes(userCountry));

    //     if (countryMatch) {
    //       setCountry(countryMatch.id);
          
    //       if (userCountry === "united states") {
    //         const userState = data.region?.toLowerCase();
    //         const stateMatch = stateList.find(c => c.name.toLowerCase().includes(userState));
            
    //         if (stateMatch) setState(stateMatch.id); 
    //       }
    //     }
    //   })
  }, []);

  // Continent geo
  useEffect(() => {
    if (!continent) {
      // Group geometries by continent
      const continentGroups: Record<string, any[]> = {};

      countries110m.objects.countries.geometries.forEach(geom => {
        const alpha2 = isoCountries.numericToAlpha2(geom.id);
        const countryData = getCountryData(alpha2);
        const cont = countryData?.continent || "Unknown";

        if (!continentGroups[cont]) continentGroups[cont] = [];
        continentGroups[cont].push(geom);
      });

      // Merge each continent into a single feature
      const mergedContinents = Object.entries(continentGroups).map(([cont, geoms]) => ({
        type: "Feature",
        properties: { continent: cont },
        geometry: merge(countries110m, geoms)
      }));

      setProjection({
        type: "FeatureCollection",
        features: mergedContinents
      });
    } else if (continent && !country) {
      const matchingCountries = countries110m.objects.countries.geometries.filter(f => {
        const alpha2 = isoCountries.numericToAlpha2(f.id);
        const countryData = getCountryData(alpha2);
        return countryData?.continent === continent;
      });

      const mergedGeometry = merge(
        countries110m,
        matchingCountries
      );

      if (matchingCountries.length) {
        setProjection({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { continent },
            geometry: mergedGeometry
          }]
        });
      }
    }
  }, [continent, country, includeCountryBorders, includeStateBorders, includeCountyBorders]);

  // Country geo
  useEffect(() => {
    if (country && !state) {
      const ALBER_COUNTRIES = new Set([
        "840" // USA
      ]);
      const geo = feature(countries110m, countries110m.objects.countries);
      const selected = geo.features.find((f: any) => f.id === country);

      if (selected) {
        setProjection(selected, ALBER_COUNTRIES.has(country));
      }
    }
  }, [country, state, includeCountryBorders, includeStateBorders, includeCountyBorders]);

  // State geo
  useEffect(() => {
    if (state && !county) {
      const ALBER_STATES = new Set([
        "02" // Alaska
      ]);
      const statesGeo = feature(states10m, states10m.objects.states);
      const selected = statesGeo.features.find((f: any) => f.id === state);
      
      if (selected) {
        setProjection(selected, ALBER_STATES.has(state));
      }
    }
  }, [state, county, includeCountryBorders, includeStateBorders, includeCountyBorders]);

  // County geo
  useEffect(() => {
    if (county) {
      const geo = feature(counties10m, counties10m.objects.counties);
      const selected = geo.features.find((f: any) => f.id === county);

      if (selected) {
        setProjection(selected);
      }
    }
  }, [county, includeCountryBorders, includeStateBorders, includeCountyBorders]);

  const setProjection = (geo, albers = false) => {
    let features = Array.isArray(geo.features) ? [...geo.features] : [geo];

    // Add country borders if enabled and not zoomed into a single country
    if (includeCountryBorders) {
      const countriesGeo = feature(countries110m, countries110m.objects.countries);

      if (!continent) {
        const allCountyFeatures = countriesGeo.features;
        features = [...features, ...allCountyFeatures];
      } else {
        const countryFeatures = countriesGeo.features.filter(f => {
          const alpha2 = isoCountries.numericToAlpha2(f.id);
          const countryData = getCountryData(alpha2);
          return countryData?.continent === continent;
        });
        features = [...features, ...countryFeatures];
      }
    }

    // Add state borders if enabled
    if (includeStateBorders) {
      const stateFeatures = feature(states10m, states10m.objects.states).features;
      features = [...features, ...stateFeatures];
    }

    // Add county borders if enabled
    if (includeCountyBorders) {
      const countiesGeo = feature(counties10m, counties10m.objects.counties);
      if (!state) {
        const allCountyFeatures = countiesGeo.features;
        features = [...features, ...allCountyFeatures];
      } else {
        const stateCountyFeatures = countiesGeo.features.filter((f: any) =>
          f.id.startsWith(state)
        );
        features = [...features, ...stateCountyFeatures];
      }
    }

    const collection = { type: "FeatureCollection", features };

    const projection = (albers ? geoAlbersUsa() : geoMercator()).fitSize([302, 302], collection);
    const path = geoPath(projection);
    const d = path(collection);
    if (d) setPathData(d);
  };

  const resetBorders = () => {
    setIncludeCountryBorders(false);
    setIncludeStateBorders(false);
    setIncludeCountyBorders(false);
  };

  const resetPathData = () => {
    setContinentsPathData(null);
    setContinentPathData(null);
    setCountiesPathData(null);
    setCountryPathData(null);
    setStatesPathData(null);
    setStatePathData(null);
    setCountiesPathData(null);
    setCountyPathData(null);
  };

  const handleSetContinent = (e) => {
    setContinent(e.target.value);
    setCountry("");
    setState("");
    setCounty("");
    resetBorders();
    resetPathData();
  };

  const handleSetCountry = (e) => {
    setCountry(e.target.value);
    setState("");
    setCounty("");
    resetBorders();
    resetPathData();
  };

  const handleSetState = (e) => {
    setState(e.target.value);
    setCounty("");
    resetBorders();
    resetPathData();
  };

  const handleSetCounty = (e) => {
    setCounty(e.target.value);
    resetBorders();
    resetPathData();
  };

  const createGeoShape = () => {
    if (pathData) {
      parent.postMessage(
        { pluginMessage: { type: "create-geo-shape", pathData } },
        "*"
      );
    }
  };

  const renderBorderOptions = () => {
    // CASE 1: No country selected
    if (!country && !state && !county) {
      return (
        <Control
          as="input"
          type="checkbox"
          label="Include country borders"
          checked={includeCountryBorders}
          onChange={(e) => setIncludeCountryBorders(e.target.checked)} />
      );
    }

    // CASE 2: North America → USA
    if (continent === "NA" && country === "840" && !state && !county) {
      return (
        <>
          <Control
            as="input"
            type="checkbox"
            label="Include state borders"
            checked={includeStateBorders}
            onChange={(e) => setIncludeStateBorders(e.target.checked)} />
          <Control
            as="input"
            type="checkbox"
            label="Include county borders"
            checked={includeCountyBorders}
            onChange={(e) => setIncludeCountyBorders(e.target.checked)} />
        </>
      );
    }

    // CASE 3: North America → USA → Any state
    if (continent === "NA" && country === "840" && state && !county) {
      return (
        <Control
          as="input"
          type="checkbox"
          label="Include county borders"
          checked={includeCountyBorders}
          onChange={(e) => setIncludeCountyBorders(e.target.checked)} />
      );
    }

    // CASE 4: North America → USA → Any state → Any county → No checkboxes
    return null;
  };

  return (
    <main className="c-app">
      <section className="c-app__body">
        <div className="c-app__logo">
          geo-shape
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
                  {continents[key]}
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
        <StateOptions
          country={country}
          state={state}
          county={county}
          states={states}
          counties={counties}
          setState={handleSetState}
          setCounty={handleSetCounty} />
        {renderBorderOptions()}
        {/* <GeoPreview
          continentsPathData={continentsPathData}
          continentPathData={continentPathData}
          countriesPathData={countriesPathData}
          countryPathData={countryPathData}
          statesPathData={statesPathData}
          statePathData={statePathData}
          countiesPathData={countiesPathData}
          countyPathData={countyPathData} /> */}
        <div className="c-app__geo-preview">
          <svg>
            <path d={pathData ?? ""} />
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