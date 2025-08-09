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
  countryPathData
}: {
  continentPathData: string | null;
  countryPathData: string | null;
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
    </div>
  );
}

export default GeoPreview;