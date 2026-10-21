import React, { useEffect, useState } from "react";

export default function PinModal({
  show,
  onClose,
  onPin,
  defaultName = "",
  pinning = false,
}) {
  const [pinnerName, setPinnerName] = useState("");

  // Reset the input every time the modal opens
  useEffect(() => {
    if (show) {
      setPinnerName(defaultName || "");
    }
  }, [show, defaultName]);

  // Allow ESC to close the modal
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !pinning) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose, pinning]);

  if (!show) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const name = pinnerName.trim();

    if (!name || pinning) {
      return;
    }

    try {
      await onPin(name);
    } catch (error) {
      console.error("Pin message error:", error);
    }
  };

  const handleOverlayMouseDown = (event) => {
    if (
      event.target === event.currentTarget &&
      !pinning
    ) {
      onClose();
    }
  };

  return (
    <div
      className="pin-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="pin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-message-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="pin-modal-header">
          <div>
            <span className="pin-modal-label">
              PIN MESSAGE
            </span>

            <h2 id="pin-message-title">
              Pin Message
            </h2>

            <p>
              Enter the name of the person who is pinning this message.
            </p>
          </div>

          <button
            type="button"
            className="pin-modal-close"
            onClick={onClose}
            disabled={pinning}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="pin-modal-field">
            <label htmlFor="pinner-name">
              Pinned by
            </label>

            <input
              id="pinner-name"
              type="text"
              value={pinnerName}
              onChange={(event) =>
                setPinnerName(event.target.value)
              }
              placeholder="Enter your name"
              autoComplete="off"
              autoFocus
              disabled={pinning}
            />
          </div>

          {/* BUTTONS */}
          <div className="pin-modal-actions">
            <button
              type="button"
              className="pin-modal-cancel"
              onClick={onClose}
              disabled={pinning}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="pin-modal-save"
              disabled={
                pinning || !pinnerName.trim()
              }
            >
              {pinning
                ? "Pinning..."
                : "Pin Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}