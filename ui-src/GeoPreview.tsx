const Overlay = ({pathData}: {pathData: string}) => (
  <svg>
    <path d={pathData} />
  </svg>
);

const GeoPreview = ({
  continentPathData,
  countryPathData,
  statePathData,
  countyPathData
}: {
  continentPathData: string | null;
  countryPathData: string | null;
  statePathData: string | null;
  countyPathData: string | null;
}) => {
  return (
    <div className="c-app__geo-preview">
      {
        continentPathData
        ? <Overlay pathData={continentPathData} />
        : null
      }
      {
        countryPathData
        ? <Overlay pathData={countryPathData} />
        : null
      }
      {
        statePathData
        ? <Overlay pathData={statePathData} />
        : null
      }
      {
        countyPathData
        ? <Overlay pathData={countyPathData} />
        : null
      }
    </div>
  );
}

export default GeoPreview;