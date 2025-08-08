import React from "react";

const Overlay = ({
  pathData, 
  ...props
}: {
  pathData: string
} & React.SVGAttributes<any> ) => (
  <svg {...props}>
    <path d={pathData} />
  </svg>
);

const GeoPreview = ({
  continentPathData,
  countryPathData,
  statePathData,
  countyPathData,
  graticulePathData,
  includeGraticules
}: {
  continentPathData: string | null;
  countryPathData: string | null;
  statePathData: string | null;
  countyPathData: string | null;
  graticulePathData: string | null;
  includeGraticules: boolean;
}) => {
  return (
    <div className="c-app__geo-preview">
      {
        graticulePathData && includeGraticules
        ? <Overlay 
            pathData={graticulePathData}
            style={{
              fill: "none"
            }} />
        : null
      }
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