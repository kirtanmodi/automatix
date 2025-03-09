import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./input.css";
import "./styles.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { createTheme, ThemeProvider } from "@mui/material/styles";

// Create a theme with Apple-inspired design
const theme = createTheme({
  palette: {
    primary: {
      main: "#0071e3", // Apple blue
    },
    secondary: {
      main: "#ff3b30", // Apple red
    },
    background: {
      default: "#f5f5f7", // Light gray background
    },
  },
  typography: {
    fontFamily: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"].join(","),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: 8,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
