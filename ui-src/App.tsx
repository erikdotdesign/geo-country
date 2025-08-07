import { useState, useEffect } from "react";
import * as d3 from "d3-geo";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import states10m from "us-atlas/states-10m.json";
import counties10m from "us-atlas/counties-10m.json";
import Select from "./Select";
import Button from "./Button";
import "./App.css";

const App = () => {
  const [pathData, setPathData] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("840");
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
        name: c.properties.name || "Unnamed"
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
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        const userCountry = data.country_name?.toLowerCase();
        const countryMatch = countryList.find(c => c.name.toLowerCase().includes(userCountry));

        if (countryMatch) {
          setCountry(countryMatch.id);
          
          if (userCountry === "united states") {
            const userState = data.region?.toLowerCase();
            const stateMatch = stateList.find(c => c.name.toLowerCase().includes(userState));
            
            if (stateMatch) setState(stateMatch.id); 
          }
        }
      })
  }, []);

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
    const projection = geoMercator().fitSize([302, 302], geo);
    const path = geoPath(projection);
    const d = path(geo);
    if (d) setPathData(d);
  }

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
        <Select
          label="Country"
          value={country}
          placeholder="-- Select a country --"
          onChange={handleSetCountry}>
          {
            countries.map((country) => (
              <option 
                key={country.id}
                value={country.id}>
                {country.name}
              </option>
            ))
          }
        </Select>
        {
          country === "840"
          ? <div className="c-control-group">
              <Select
                label="State"
                value={state}
                placeholder="-- Select a state --"
                onChange={handleSetState}>
                <option value="">All states</option>
                {
                  states.map((state) => (
                    <option 
                      key={state.id}
                      value={state.id}>
                      {state.name}
                    </option>
                  ))
                }
              </Select>
              {
                state
                ? <Select
                    label="County"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}>
                    <option value="">All counties</option>
                    {
                      counties.map((county) => {
                        if (county.id.startsWith(state)) {
                          return (
                            <option 
                              key={county.id}
                              value={county.id}>
                              {county.name}
                            </option>
                          )
                        }
                      })
                    }
                  </Select>
                : null
              }
            </div>
          : null
        }
        <div className="c-app__geo-preview">
          <svg fill="#ccc">
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