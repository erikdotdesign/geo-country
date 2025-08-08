import Select from "./Select";
import "./App.css";

const StateOptions = ({
  country,
  states,
  state,
  counties,
  county,
  setState,
  setCounty
}: {
  country: string;
  state: string;
  county: string;
  states: any[];
  counties: any[];
  setState: (e: any) => void;
  setCounty: (e: any) => void;
}) => {
  return (
    country === "840"
    ? <div className="c-control-group">
        <Select
          label="State"
          value={state}
          onChange={setState}>
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
              onChange={setCounty}>
              <option value="">All counties</option>
              {
                counties
                  .filter(c => c.id.startsWith(state))
                  .map((county) => (
                    <option 
                      key={county.id}
                      value={county.id}>
                      {county.name}
                    </option>
                  ))
              }
            </Select>
          : null
        }
      </div>
    : null
  );
}

export default StateOptions;