import Control from "./Control";

const BorderControls = ({
  continent,
  country,
  state,
  county,
  includeCountryBorders,
  includeStateBorders,
  includeCountyBorders,
  setIncludeCountryBorders,
  setIncludeStateBorders,
  setIncludeCountyBorders
}: {
  continent: string;
  country: string;
  state: string;
  county: string;
  includeCountryBorders: boolean;
  includeStateBorders: boolean;
  includeCountyBorders: boolean;
  setIncludeCountryBorders: (e: any) => void;
  setIncludeStateBorders: (e: any) => void;
  setIncludeCountyBorders: (e: any) => void;
}) => {
  const countryBorderToggle = !country && !state && !county;
  const stateBorderToggle = continent === "NA" && country === "840" && !state && !county;
  const countyBorderToggle = continent === "NA" && country === "840" && !county;

  return (
    <>
      {
        countryBorderToggle
        ? <Control
            as="input"
            type="checkbox"
            label="Include country borders"
            checked={includeCountryBorders}
            onChange={setIncludeCountryBorders} />
        : null
      }
      {
        stateBorderToggle
          ? <Control
              as="input"
              type="checkbox"
              label="Include state borders"
              checked={includeStateBorders}
              onChange={setIncludeStateBorders} />
          : null
      }
      {
        countyBorderToggle
        ? <Control
            as="input"
            type="checkbox"
            label="Include county borders"
            checked={includeCountyBorders}
            onChange={setIncludeCountyBorders} />
        : null
      }
    </>
  );
}

export default BorderControls;