import React from "react";

export default function Navbar({
  totalPinned = 0,
  onOpenPinned,
}) {
  return (
    <header className="navbar">

      <div className="navbar-logo">

        <div className="logo-mark">
          W
        </div>

        <div>
          <h2>
            WALASTIK
          </h2>

          <span>
            INFORMATION CENTER
          </span>
        </div>

      </div>

      <button
        type="button"
        className="pinned-nav-button"
        onClick={onOpenPinned}
      >

        <span>
          Pinned
        </span>

        {totalPinned > 0 && (
          <strong>
            {totalPinned}
          </strong>
        )}

      </button>

    </header>
  );
}