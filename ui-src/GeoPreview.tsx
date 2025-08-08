const GeoPreview = (props) => {
  return (
    <div className="c-app__geo-preview">
      {
        props.map((pathData) => (
          <svg>
            <path d={pathData ?? ""} />
          </svg>
        ))
      }
    </div>
  );
}

export default GeoPreview;