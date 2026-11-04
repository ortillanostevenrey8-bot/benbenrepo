import React from "react";

function AnnouncementAllModal({
  announcements = [],
  onClose,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  pinningId = null,
}) {
  const formatDate = (value) => {
    if (!value) return "";

    try {
      if (
        typeof value === "object" &&
        value.seconds
      ) {
        return new Date(
          value.seconds * 1000
        ).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }

      return new Date(value).toLocaleString(
        "en-PH",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return "";
    }
  };

  return (
    <div
      className="all-announcements-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >

      <div className="all-announcements-modal">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="all-announcements-header">

          <div>

            <div className="panel-label">
              A N N O U N C E M E N T S
            </div>

            <h2>
              All Announcements
            </h2>

            <p>
              View all published announcements
              and updates.
            </p>

          </div>

          <button
            type="button"
            className="all-announcements-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}
        <div className="all-announcements-list">

          {announcements.length === 0 ? (
            <div className="empty-state large">
              No announcements found.
            </div>
          ) : (
            announcements.map(
              (announcement) => {

                const isPinned =
                  announcement.pinned === true;

                const isPinning =
                  pinningId === announcement.id;

                return (
                  <article
                    key={announcement.id}
                    className="all-announcement-card"
                  >

                    {/* TITLE */}
                    <div className="all-announcement-title-row">

                      <h3>
                        {String(
                          announcement.title ||
                            "Untitled Announcement"
                        )}
                      </h3>

                      {isPinned && (
                        <span className="pinned-badge">
                          PINNED
                        </span>
                      )}

                    </div>

                    {/* MESSAGE */}
                    <p className="all-announcement-message">
                      {String(
                        announcement.details ||
                          announcement.content ||
                          ""
                      )}
                    </p>

                    {/* META */}
                    <div className="all-announcement-meta">

                      <span>
                        {formatDate(
                          announcement.createdAt ||
                            announcement.createdDate ||
                            announcement.date
                        )}
                      </span>

                      {isPinned &&
                        announcement.pinnedBy && (
                          <span className="pinned-by">
                            • Pinned by{" "}
                            {announcement.pinnedBy}
                          </span>
                        )}

                    </div>

                    {/* ACTIONS */}
                    <div className="all-announcement-actions">

                      <button
                        type="button"
                        className={
                          isPinned
                            ? "announcement-pin-button pinned"
                            : "announcement-pin-button"
                        }
                        disabled={isPinning}
                        onClick={() => {
                          if (isPinned) {
                            onUnpin?.(
                              announcement
                            );
                          } else {
                            onPin?.(
                              announcement
                            );
                          }
                        }}
                      >
                        {isPinning
                          ? "..."
                          : isPinned
                          ? "Unpin"
                          : "Pin"}
                      </button>

                      <button
                        type="button"
                        className="announcement-edit-button"
                        onClick={() =>
                          onEdit?.(announcement)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="announcement-delete-button"
                        onClick={() =>
                          onDelete?.(
                            announcement.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </article>
                );
              }
            )
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}
        <div className="all-announcements-footer">

          <button
            type="button"
            className="modal-secondary-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

export default AnnouncementAllModal;