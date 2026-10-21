import React from "react";

export default function AnnouncementModal({
  show,
  title,
  setTitle,
  details,
  setDetails,
  editing = false,
  saving = false,
  onSave,
  onClose,
}) {
  if (!show) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    await onSave();
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose();
    }
  };

  return (
    <div
      className="announcement-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="announcement-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="announcement-modal-header">
          <div className="announcement-modal-heading">
            <span className="announcement-modal-label">
              {editing
                ? "EDIT ANNOUNCEMENT"
                : "NEW ANNOUNCEMENT"}
            </span>

            <h2>
              {editing
                ? "Edit Announcement"
                : "Add Announcement"}
            </h2>

            <p>
              Create an announcement for the WALASTIK
              Information Center.
            </p>
          </div>

          <button
            type="button"
            className="announcement-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* TITLE */}
          <div className="announcement-modal-field">
            <label htmlFor="announcement-title">
              Announcement Title
            </label>

            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter announcement title..."
              disabled={saving}
              autoComplete="off"
            />
          </div>

          {/* DETAILS */}
          <div className="announcement-modal-field">
            <label htmlFor="announcement-details">
              Announcement Details
            </label>

            <textarea
              id="announcement-details"
              value={details}
              onChange={(event) =>
                setDetails(event.target.value)
              }
              placeholder="Enter announcement details..."
              disabled={saving}
            />
          </div>

          {/* BUTTONS */}
          <div className="announcement-modal-actions">
            <button
              type="button"
              className="announcement-modal-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="announcement-modal-save"
              disabled={
                saving ||
                !title.trim() ||
                !details.trim()
              }
            >
              {saving
                ? "Saving..."
                : editing
                ? "Update"
                : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}