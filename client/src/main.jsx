import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App";
import { store } from "./store";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: "DM Sans, sans-serif",
            borderRadius: "12px",
            border: "1px solid #E7E5E4",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
          success: { iconTheme: { primary: "#F97316", secondary: "#fff" } },
        }}
      />
    </Provider>
  </React.StrictMode>,
);
