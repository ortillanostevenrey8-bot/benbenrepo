import React from "react";

export default function LoadingScreen({ message = "Loading information..." }) {
  return (
    <div className="initial-loading-screen" role="status" aria-live="polite">
      <div className="initial-loading-content">
        <div className="initial-loading-logo">W</div>
        <div className="initial-loading-brand">WALASTIK ENTERPRISE</div>
        <div className="initial-loading-title">Information Center</div>
        <div className="initial-loading-text">{message}</div>
        <div className="initial-loading-bar">
          <div className="initial-loading-bar-fill" />
        </div>
      </div>
    </div>
  );
}
