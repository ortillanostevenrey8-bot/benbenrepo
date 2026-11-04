import React from "react";

function AnnouncementPanel({
  announcements = [],
  loading = false,

  search = "",
  setSearch,

  onOpen,
  onAdd,
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
          dateStyle: "short",
          timeStyle: "short",
        });
      }

      return new Date(value).toLocaleString(
        "en-PH",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      );
    } catch {
      return "";
    }
  };

  return (
    <section className="panel announcement-panel">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="announcement-panel-header">

        <div className="announcement-heading">

          <div className="panel-label">
            A N N O U N C E M E N T S
          </div>

          <h2>
            Latest Updates
          </h2>

          <p className="panel-description">
            Stay updated with the latest news
            and important announcements.
          </p>

        </div>

        <button
          type="button"
          className="open-announcement-top-button"
          onClick={onAdd}
        >
          Add Announcement
        </button>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}
      <div className="announcement-search-wrap">

        <span className="search-icon">
          ⌕
        </span>

        <input
          type="text"
          className="announcement-search"
          value={search}
          onChange={(event) =>
            setSearch?.(event.target.value)
          }
          placeholder="Search announcements..."
        />

      </div>

      <div className="panel-divider" />

      {/* =====================================================
          ANNOUNCEMENT LIST
      ===================================================== */}
      <div className="announcement-preview-list">

        {loading ? (
          <div className="loading-state">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            No announcements found.
          </div>
        ) : (
          announcements.map((announcement) => {

            const isPinning =
              pinningId === announcement.id;

            const isPinned =
              announcement.pinned === true;

            return (
              <article
                key={announcement.id}
                className="announcement-preview-card"
              >

                {/* =================================================
                    CONTENT
                ================================================= */}
                <div className="announcement-card-content">

                  <div className="preview-title-row">

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

                  <p className="announcement-message">
                    {String(
                      announcement.details ||
                      announcement.content ||
                      ""
                    )}
                  </p>

                  <div className="announcement-meta">

                    <span className="announcement-date">
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
                          {String(
                            announcement.pinnedBy
                          )}
                        </span>
                      )}

                  </div>

                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}
                <div className="announcement-card-actions">

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
                        onUnpin?.(announcement);
                      } else {
                        onPin?.(announcement);
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
                      onDelete?.(announcement.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </article>
            );
          })
        )}

      </div>

      {/* =====================================================
          VIEW ALL
      ===================================================== */}
      <button
        type="button"
        className="open-announcement-button"
        onClick={onOpen}
      >
        View All Announcements
        <span>›</span>
      </button>

    </section>
  );
}

export default AnnouncementPanel;