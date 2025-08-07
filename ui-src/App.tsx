import { useState } from "react";
import Control from "./Control";
import Button from "./Button";
import "./App.css";

const App = () => {
  const [location, setLocation] = useState<string>("");

  return (
    <main className="c-app">
      <section className="c-app__body">
        <Control
          as="input"
          type="text"
          placeholder="Enter location..."
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)} />
        <div className="c-app__geo-preview" />
      </section>
      <footer className="c-app__footer">
        <Button type="primary">
          Add to document
        </Button>
      </footer>
    </main>
  );
}

export default App;