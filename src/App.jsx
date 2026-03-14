import React, { useState, useCallback } from "react";

// Styles
import GlobalStyles from "./styles/GlobalStyles";

// Components
import DemoNav from "./components/DemoNav";

// Pages
import HomeScreen       from "./pages/HomeScreen";
import CreateRoomScreen from "./pages/CreateRoomScreen";
import JoinRoomScreen   from "./pages/JoinRoomScreen";
import RoomCreatedScreen from "./pages/RoomCreatedScreen";
import ChatRoomScreen   from "./pages/ChatRoomScreen";
import FileDropScreen   from "./pages/FileDropScreen";
import ReceiveFileScreen from "./pages/ReceiveFileScreen";
import FileReadyScreen  from "./pages/FileReadyScreen";
import NotFoundScreen   from "./pages/NotFoundScreen";

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
};

// Pages hidden from the demo nav bar
const NAV_HIDDEN = new Set(["roomcreated", "chat", "fileready", "404"]);

export default function App() {
  const [page, setPage] = useState("home");

  const navigate = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const Screen = SCREENS[page] || NotFoundScreen;

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

      {/* Demo navigation (5 items — hidden pages excluded) */}
      <DemoNav
        current={page}
        navigate={navigate}
        hidden={NAV_HIDDEN}
      />
    </>
  );
}