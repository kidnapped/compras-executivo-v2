import React from "react"; // Import React explicitly
import ReactDOM from "react-dom/client"; // Import ReactDOM for createRoot
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement); // Use createRoot from ReactDOM

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
