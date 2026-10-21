import React from "react";

export default function ConfirmDialog({
  show,
  title = "Are you sure?",
  message,
  label = "CONFIRM DELETE",
  onCancel,
  onConfirm,
  loading = false,
  cancelText = "No, keep it",
  confirmText = "Yes, delete",
  loadingText = "Deleting...",
  confirmVariant = "danger",
}) {
  if (!show) return null;

  return (
    <div
      className="confirm-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel?.();
        }
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <span className="confirm-dialog-label">{label}</span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-no-button"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-yes-button${confirmVariant === "primary" ? " confirm-primary-button" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
