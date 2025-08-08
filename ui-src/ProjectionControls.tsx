import Select from "./Select";
import Control from "./Control";
import { capitalize } from "./helpers";
import "./App.css";

const ProjectionOptions = ({
  projectionType,
  includeGraticules,
  setProjectionType,
  setIncludeGraticules
}: {
  projectionType: string;
  includeGraticules: boolean;
  setProjectionType: (e: any) => void;
  setIncludeGraticules: (e: any) => void;
}) => {
  const projections = {
    azimuthal: [{
      name: "Azimuthal Equal-Area",
      value: "geoAzimuthalEqualArea"
    },{
      name: "Azimuthal Equidistant",
      value: "geoAzimuthalEquidistant"
    },{
      name: "Gnomonic",
      value: "geoGnomonic"
    },{
      name: "Orthographic",
      value: "geoOrthographic"
    },{
      name: "Stereographic",
      value: "geoStereographic"
    }],
    conic: [{
      name: "Conic Conformal",
      value: "geoConicConformal"
    },{
      name: "Conic Equal-Area",
      value: "geoConicEqualArea"
    },{
      name: "Conic Equidistant",
      value: "geoConicEquidistant"
    },{
      name: "Albers Usa",
      value: "geoAlbersUsa"
    }],
    cylindrical: [{
      name: "Equirectangular",
      value: "geoEquirectangular"
    },{
      name: "Mercator",
      value: "geoMercator"
    },{
      name: "Transverse Mercator",
      value: "geoTransverseMercator"
    },{
      name: "Equal Earth",
      value: "geoEqualEarth"
    },{
      name: "Natural Earth 1",
      value: "geoNaturalEarth1"
    }]
  }

  return (
    <>
      <Select
        label="Projection"
        value={projectionType}
        onChange={setProjectionType}>
        {
          Object.keys(projections).map((key) => (
            <optgroup label={capitalize(key)}>
              {
                projections[key].map((p) => (
                  <option 
                    key={p.value}
                    value={p.value}>
                    {p.name}
                  </option>
                ))
              }
            </optgroup>
          ))
        }
      </Select>
      <Control
        as="input"
        type="checkbox"
        label="Include Graticule"
        checked={includeGraticules}
        onChange={setIncludeGraticules} />
    </>
  );
}

export default ProjectionOptions;