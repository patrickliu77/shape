import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import "./index.css";

// StrictMode intentionally double-mounts every component in dev to surface
// effect-cleanup bugs. That doubling races the <audio> element's preload+
// play and produced the "second narrator 2s later" bug. We've audited the
// cleanups; turning StrictMode off here keeps the demo single-voiced.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
