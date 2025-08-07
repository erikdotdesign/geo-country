import { useState, useEffect } from "react";
import * as d3 from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { continents, getCountryData } from "countries-list";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import states10m from "us-atlas/states-10m.json";
import counties10m from "us-atlas/counties-10m.json";
import Select from "./Select";
import Button from "./Button";
import StateOptions from "./StateOptions";
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

  useEffect(() => {
    const countriesGeo = feature(countries110m as any, countries110m.objects.countries);

    if (!continent) {
      const allContinents = countriesGeo.features;
      setProjection({
        type: "FeatureCollection",
        features: allContinents
      });
    } else if (continent || !country) {
      const matchingCountries = countriesGeo.features.filter(f => {
        const alpha2 = isoCountries.numericToAlpha2(f.id);
        const countryData = getCountryData(alpha2);
        return countryData?.continent === continent;
      });

      if (matchingCountries.length) {
        setProjection({
          type: "FeatureCollection",
          features: matchingCountries
        });
      }
    }
  }, [continent, country]);

  useEffect(() => {
    if (country || !state) {
      const geo = feature(countries110m as any, countries110m.objects.countries);
      const selected = geo.features.find((f: any) => f.id === country);

      if (selected) {
        setProjection(selected);
      }
    }
  }, [country, state]);

  useEffect(() => {
    if (state || !county) {
      const geo = feature(states10m as any, states10m.objects.states);
      const selected = geo.features.find((f: any) => f.id === state);

      if (selected) {
        setProjection(selected);
      }
    }
  }, [state, county]);

  useEffect(() => {
    if (county) {
      const geo = feature(counties10m as any, counties10m.objects.counties);
      const selected = geo.features.find((f: any) => f.id === county);

      if (selected) {
        setProjection(selected);
      }
    }
  }, [county]);

  const setProjection = (geo) => {
    const projection = geoMercator().fitSize([270, 270], geo);
    const path = geoPath(projection);
    const d = path(geo);
    if (d) setPathData(d);
  };

  const handleSetContinent = (e) => {
    setContinent(e.target.value);
    setCountry("");
    setState("");
    setCounty("");
  };

  const handleSetCountry = (e) => {
    setCountry(e.target.value);
    setState("");
    setCounty("");
  };

  const handleSetState = (e) => {
    setState(e.target.value);
    setCounty("");
  };

  const createGeoShape = () => {
    if (pathData) {
      parent.postMessage(
        { pluginMessage: { type: "create-geo-shape", pathData } },
        "*"
      );
    }
  };

  return (
    <main className="c-app">
      <section className="c-app__body">
        <div className="c-app__logo">
          geoshape
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
          handleSetState={handleSetState}
          setCounty={setCounty} />
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