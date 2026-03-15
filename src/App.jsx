import React, { useState, useCallback, useEffect } from "react";
import { useAppContext } from "./context/AppContext";

// Styles
import GlobalStyles from "./styles/GlobalStyles";

// Components
import NavBar from "./components/NavBar";

// Pages
import HomeScreen        from "./pages/HomeScreen";
import CreateRoomScreen  from "./pages/CreateRoomScreen";
import JoinRoomScreen    from "./pages/JoinRoomScreen";
import RoomCreatedScreen from "./pages/RoomCreatedScreen";
import ChatRoomScreen    from "./pages/ChatRoomScreen";
import FileDropScreen    from "./pages/FileDropScreen";
import ReceiveFileScreen from "./pages/ReceiveFileScreen";
import FileReadyScreen   from "./pages/FileReadyScreen";
import UserGuideScreen   from "./pages/UserGuideScreen";
import NotFoundScreen    from "./pages/NotFoundScreen";
import SettingsScreen    from "./pages/SettingsScreen";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "white", fontFamily: "var(--font-body)" }}>
          <h1 style={{ color: "var(--yellow)" }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.toString()}
            {this.state.info?.componentStack ? "\n" + this.state.info.componentStack : ""}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SCREENS = {
  home:        HomeScreen,
  create:      CreateRoomScreen,
  join:        JoinRoomScreen,
  roomcreated: RoomCreatedScreen,
  chat:        ChatRoomScreen,
  filedrop:    FileDropScreen,
  receive:     ReceiveFileScreen,
  fileready:   FileReadyScreen,
  404:         NotFoundScreen,
  userguide:   UserGuideScreen,
  settings:    SettingsScreen,
};

// Pages hidden from the nav bar
const NAV_HIDDEN = new Set(["roomcreated", "chat", "fileready", "404"]);

const parsePath = (path) => {
  const clean = String(path || "").replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return "home";
  return SCREENS[clean] ? clean : "404";
};

export default function App() {
  const [page, setPage] = useState(() => parsePath(window.location.pathname));
  const { settings } = useAppContext();
  const { darkMode, textSize } = settings;

  const navigate = useCallback((p) => {
    const next = SCREENS[p] ? p : "404";
    setPage(next);
    const url = next === "home" ? "/" : `/${next}`;
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const Screen = SCREENS[page] || NotFoundScreen;

  // Apply theme & scale settings
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    const scale = textSize === "small" ? 0.92 : textSize === "large" ? 1.12 : 1;
    document.documentElement.style.setProperty("--text-scale", String(scale));
  }, [textSize]);


  // Handle browser navigation (back/forward)
  React.useEffect(() => {
    const onPop = () => setPage(parsePath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <>
      <GlobalStyles />

      {/* Ambient background layers */}
      <div className="grid-bg" />
      <div className="scanlines" />

      {/* Animated page mount — key forces re-mount on route change */}
      <div key={page}>
        <ErrorBoundary>
          <Screen navigate={navigate} />
        </ErrorBoundary>
      </div>

      {/* Navigation (5 items — hidden pages excluded) */}
      <NavBar
        current={page}
        navigate={navigate}
        hidden={NAV_HIDDEN}
      />
    </>
  );
}