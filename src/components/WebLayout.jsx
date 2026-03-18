/**
 * WebLayout.jsx
 *
 * Provides a consistent web-first shell around every screen:
 *  ┌──────────────┬──────────────────────────────────────┐
 *  │  Sidebar Nav │         Main Content Area            │
 *  │  (desktop)   │  (scrollable, full remaining width)  │
 *  └──────────────┴──────────────────────────────────────┘
 *
 * On mobile (< 768 px) the sidebar collapses to a bottom tab-bar.
 *
 * Usage:
 *   <WebLayout navigate={navigate} currentPage="home">
 *     <YourPageContent />
 *   </WebLayout>
 *
 * Props:
 *   navigate      – routing fn
 *   currentPage   – active route key (for highlighting nav items)
 *   children      – page content
 *   noPadding     – skip inner padding (e.g. ChatRoomScreen manages its own)
 *   fullHeight    – content area uses 100% height (for chat)
 */

import { useState } from "react";
import Icon from "../components/Icon";
import AlertBar from "../components/AlertBar";

const NAV_ITEMS = [
  { key: "home",     icon: "home",     label: "Home"       },
  { key: "create",   icon: "plus",     label: "Create Room" },
  { key: "join",     icon: "lock",     label: "Join Room"   },
  { key: "filedrop", icon: "upload",   label: "File Drop"   },
  { key: "receive",  icon: "download", label: "Receive"     },
  { key: "settings", icon: "settings", label: "Settings"    },
  { key: "userguide", icon: "book",     label: "User Guide"  },
];

const SidebarItem = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      background: active ? "rgba(245,196,0,0.12)" : "transparent",
      color: active ? "var(--yellow)" : "var(--grey)",
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      letterSpacing: "0.5px",
      textAlign: "left",
      transition: "all 0.18s ease",
      outline: active ? "1px solid rgba(245,196,0,0.2)" : "1px solid transparent",
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.color = "var(--white)";
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--grey)";
      }
    }}
  >
    <div style={{
      width: 32,
      height: 32,
      borderRadius: 8,
      background: active ? "rgba(245,196,0,0.15)" : "rgba(255,255,255,0.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon name={item.icon} size={15} color={active ? "var(--yellow)" : "var(--grey)"} />
    </div>
    {item.label}
  </button>
);

const Sidebar = ({ navigate, currentPage }) => (
  <div style={{
    width: 220,
    flexShrink: 0,
    background: "rgba(11,11,11,0.98)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 12px",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  }}>
    {/* Logo */}
    <div style={{ paddingLeft: 6, marginBottom: 28 }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: "-0.5px",
        color: "var(--white)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28,
          background: "var(--yellow)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="shield" size={14} color="#0B0B0B" />
        </div>
        SecureCore
      </div>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        color: "var(--grey)",
        letterSpacing: "1.5px",
        marginTop: 4,
        paddingLeft: 36,
      }}>
        // PROTOCOL v2.1
      </div>
    </div>

    {/* Nav items */}
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
      {NAV_ITEMS.map(item => (
        <SidebarItem
          key={item.key}
          item={item}
          active={currentPage === item.key}
          onClick={() => navigate(item.key)}
        />
      ))}
    </div>

    {/* Status footer */}
    <div style={{
      borderTop: "1px solid var(--border)",
      paddingTop: 16,
      marginTop: 8,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--green)",
          boxShadow: "0 0 6px var(--green)",
          animation: "pulseDot 1.5s ease-in-out infinite",
        }} />
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--green)",
          letterSpacing: "0.5px",
        }}>
          AES-256 ACTIVE
        </span>
      </div>
    </div>
  </div>
);

/* Bottom tab bar for mobile */
const BottomNav = ({ navigate, currentPage }) => {
  const mobileItems = NAV_ITEMS.slice(0, 5); // show first 5 on mobile
  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "rgba(11,11,11,0.97)",
      borderTop: "1px solid var(--border)",
      backdropFilter: "blur(16px)",
      display: "flex",
      zIndex: 200,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {mobileItems.map(item => {
        const active = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: active ? "var(--yellow)" : "var(--grey)",
            }}
          >
            <Icon name={item.icon} size={20} color={active ? "var(--yellow)" : "var(--grey)"} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.3px",
              color: active ? "var(--yellow)" : "var(--grey)",
            }}>
              {item.label.toUpperCase().split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const WebLayout = ({ navigate, currentPage, children, noPadding = false, fullHeight = false }) => {
  return (
    <>
      {/* Inject responsive CSS once */}
      <style>{`
        .web-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }
        .web-sidebar {
          display: none;
        }
        .web-main {
          flex: 1;
          overflow-y: ${fullHeight ? "hidden" : "auto"};
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .web-content {
          flex: 1;
          padding: ${noPadding ? "0" : "32px 40px"};
          display: flex;
          flex-direction: column;
          max-width: ${fullHeight ? "none" : "960px"};
        }
        .mobile-bottom-nav {
          display: flex;
        }
        .mobile-nav-spacer {
          height: 68px;
        }
        @media (min-width: 768px) {
          .web-sidebar {
            display: flex !important;
          }
          .mobile-bottom-nav {
            display: none !important;
          }
          .mobile-nav-spacer {
            display: none;
          }
          .web-content {
            padding: ${noPadding ? "0" : "40px 48px"};
          }
        }
        @media (min-width: 1280px) {
          .web-content {
            padding: ${noPadding ? "0" : "48px 64px"};
          }
        }
      `}</style>

      <div className="web-shell">
        {/* Sidebar (desktop) */}
        <div className="web-sidebar">
          <Sidebar navigate={navigate} currentPage={currentPage} />
        </div>

        {/* Main content */}
        <div className="web-main">
          <div className={`web-content${fullHeight ? " full-height-content" : ""}`}
            style={fullHeight ? { flex: 1, display: "flex", flexDirection: "column", padding: 0, maxWidth: "none" } : {}}
          >
            {children}
          </div>

          {/* Mobile bottom spacer */}
          <div className="mobile-nav-spacer" />
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <div className="mobile-bottom-nav">
        <BottomNav navigate={navigate} currentPage={currentPage} />
      </div>

      {/* Global alert bar */}
      <AlertBar />
    </>
  );
};

export default WebLayout;