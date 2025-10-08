// src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { logoutUser, getCurrentUser } from "./services/auth";

// -------------------- Error Boundary --------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
          <h1 className="text-3xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-700 mt-2 mb-4">
            Please refresh the page or try again later.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// -------------------- Theme Provider --------------------
const ThemeProvider = ({ children }) => {
  // Placeholder for dark/light theme toggle
  // You can implement localStorage-based theme persistence here
  return <div className="theme-wrapper">{children}</div>;
};

// -------------------- Idle Logout --------------------
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
let idleTimer;

const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const user = getCurrentUser();
    if (user) {
      logoutUser();
      alert("You have been logged out due to inactivity.");
      window.location.href = "/login";
    }
  }, IDLE_TIMEOUT);
};

// Track user activity
const trackUserActivity = () => {
  ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((event) =>
    window.addEventListener(event, resetIdleTimer)
  );
  resetIdleTimer();
};

// -------------------- Mount App --------------------
function Root() {
  useEffect(() => {
    trackUserActivity();
    return () => {
      ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
