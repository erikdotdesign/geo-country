import { useState, useEffect } from "react";
import * as d3 from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { continents, getCountryData } from "countries-list";
import { feature, merge } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import states10m from "us-atlas/states-10m.json";
import usNation10m from "us-atlas/nation-10m.json";
import counties10m from "us-atlas/counties-10m.json";
import Select from "./Select";
import Button from "./Button";
import StateOptions from "./StateOptions";
import Control from "./Control";
import GeoPreview from "./GeoPreview";
import BorderControls from "./BorderOptions";
import ProjectionOptions from "./ProjectionControls";
import "./App.css";
import { getPathData, getGraticulePathData } from "./helpers";

const App = () => {
  const [continent, setContinent] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState([]);
  const [state, setState] = useState<string>("");
  const [states, setStates] = useState([]);
  const [county, setCounty] = useState<string>("");
  const [counties, setCounties] = useState([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(false);
  const [includeStateBorders, setIncludeStateBorders] = useState<boolean>(false);
  const [includeCountyBorders, setIncludeCountyBorders] = useState<boolean>(false);
  const [continentPathData, setContinentPathData] = useState<string | null>(null);
  const [countryPathData, setCountryPathData] = useState<string | null>(null);
  const [statePathData, setStatePathData] = useState<string | null>(null);
  const [countyPathData, setCountyPathData] = useState<string | null>(null);
  const [projectionType, setProjectionType] = useState<string>("geoMercator");
  const [includeGraticules, setIncludeGraticules] = useState<boolean>(false);
  const [graticulePathData, setGraticulePathData] = useState<string | null>(null);

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

      const pathData = getPathData(mergedContinents, projectionType);

      setContinentPathData(pathData);

      if (includeGraticules) {
        const graticulePathData = getGraticulePathData(projectionType);
        setGraticulePathData(graticulePathData);
      }
      
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

      const pathData = getPathData([{
        type: "Feature",
        properties: { continent },
        geometry: mergedGeometry
      }], "geoMercator");
      
      setContinentPathData(pathData);
    }
  }, [continent, country, projectionType]);

  // Country geo
  useEffect(() => {
    if (country && !state) {
      const isUsa = country === "840";
      const countryGeo = feature(countries110m, countries110m.objects.countries);
      const usNationGeo = feature(usNation10m, usNation10m.objects.nation);
      
      let featuresArray;

      if (isUsa) {
        featuresArray = usNationGeo.features;
      } else {
        const selected = countryGeo.features.find((f: any) => f.id === country);
        featuresArray = selected ? [selected] : [];
      }

      const pathData = getPathData(featuresArray, isUsa ? "geoAlbersUsa" : "geoMercator");
      setCountryPathData(pathData);
    }
  }, [country, state]);

  // State geo
  useEffect(() => {
    if (state && !county) {
      const ALBER_STATES = new Set([
        "02" // Alaska
      ]);
      const useAlbers = ALBER_STATES.has(state);
      const statesGeo = feature(states10m, states10m.objects.states);
      const selected = statesGeo.features.find((f: any) => f.id === state);
      const pathData = getPathData([selected], useAlbers ? "geoAlbersUsa" : "geoMercator");
      setStatePathData(pathData);
    }
  }, [state, county]);

  // County geo
  useEffect(() => {
    if (county) {
      const geo = feature(counties10m, counties10m.objects.counties);
      const selected = geo.features.find((f: any) => f.id === county);
      const pathData = getPathData([selected], "geoMercator");
      setCountyPathData(pathData);
    }
  }, [county]);

  const resetBorders = () => {
    setIncludeCountryBorders(false);
    setIncludeStateBorders(false);
    setIncludeCountyBorders(false);
  };

  const resetPathData = () => {
    setContinentPathData(null);
    setCountryPathData(null);
    setStatePathData(null);
    setCountyPathData(null);
  };

  const handleSetContinent = (e) => {
    setContinent(e.target.value);
    setCountry("");
    setState("");
    setCounty("");
    resetBorders();
    resetPathData();
    if (e.target.value) {
      setIncludeGraticules(false);
    }
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

  const handleIncludeGraticules = (e) => {
    const checked = e.target.checked;
    setIncludeGraticules(checked);

    if (checked) {
      const graticulePathData = getGraticulePathData(projectionType);
      setGraticulePathData(graticulePathData);
    } else {
      setGraticulePathData(null);
    }
  }

  const handleIncludeCountryBorders = (e) => {
    const checked = e.target.checked;
    setIncludeCountryBorders(checked);

    if (checked) {
      let features;
      const countriesGeo = feature(countries110m, countries110m.objects.countries);

      if (!continent) {
        features = countriesGeo.features;
      } else {
        features = countriesGeo.features.filter(f => {
          const alpha2 = isoCountries.numericToAlpha2(f.id);
          const countryData = getCountryData(alpha2);
          return countryData?.continent === continent;
        });
      }
      const pathData = getPathData(features, "geoMercator");
      setCountryPathData(pathData);
    } else {
      setCountryPathData(null);
    }
  };

  const handleIncludeStateBorders = (e) => {
    const checked = e.target.checked;
    setIncludeStateBorders(checked);

    if (checked) {
      const features = feature(states10m, states10m.objects.states).features;
      const pathData = getPathData(features, "geoAlbersUsa");
      setStatePathData(pathData);
    } else {
      setStatePathData(null);
    }
  };

  const handleIncludeCountyBorders = (e) => {
    const checked = e.target.checked;
    setIncludeCountyBorders(checked);

    if (checked) {
      let features;
      let useAlbers;
      const countiesGeo = feature(counties10m, counties10m.objects.counties);
      if (!state) {
        useAlbers = true;
        features = countiesGeo.features;
      } else {
        const ALBER_STATES = new Set([
          "02" // Alaska
        ]);
        useAlbers = ALBER_STATES.has(state);
        features = countiesGeo.features.filter((f: any) =>
          f.id.startsWith(state)
        );;
      }
      const pathData = getPathData(features, useAlbers ? "geoAlbersUsa" : "geoMercator");
      setCountyPathData(pathData);
    } else {
      setCountyPathData(null);
    }
  };

  const createGeoShape = () => {
    const pathData = continentPathData || countryPathData || statePathData || countyPathData;
    if (pathData) {
      parent.postMessage(
        { 
          pluginMessage: { 
            type: "create-geo-shape", 
            pathData: {
              continentPathData,
              countryPathData,
              statePathData,
              countyPathData
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
        {
          !continent
            ? <ProjectionOptions
                projectionType={projectionType}
                includeGraticules={includeGraticules}
                setProjectionType={(e) => setProjectionType(e.target.value)}
                setIncludeGraticules={handleIncludeGraticules} />
            : null
        }
        <StateOptions
          country={country}
          state={state}
          county={county}
          states={states}
          counties={counties}
          setState={handleSetState}
          setCounty={handleSetCounty} />
        <BorderControls
          continent={continent}
          country={country}
          state={state}
          county={county}
          includeCountryBorders={includeCountryBorders}
          includeStateBorders={includeStateBorders}
          includeCountyBorders={includeCountyBorders}
          setIncludeCountryBorders={handleIncludeCountryBorders}
          setIncludeStateBorders={handleIncludeStateBorders}
          setIncludeCountyBorders={handleIncludeCountyBorders} />
        <GeoPreview
          continentPathData={continentPathData}
          countryPathData={countryPathData}
          statePathData={statePathData}
          countyPathData={countyPathData}
          graticulePathData={graticulePathData}
          includeGraticules={includeGraticules} />
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