import React from "react";

export default function PinnedMessages({
  show,
  announcements = [],
  knowledge = [],
  onClose,
  onUnpinAnnouncement,
  onUnpinKnowledge,
}) {
  if (!show) {
    return null;
  }

  const getDetails = (item) => {
    if (!item || typeof item !== "object") {
      return "";
    }

    if (typeof item.details === "string") {
      return item.details;
    }

    if (typeof item.content === "string") {
      return item.content;
    }

    if (typeof item.description === "string") {
      return item.description;
    }

    if (typeof item.message === "string") {
      return item.message;
    }

    return "";
  };

  const formatDate = (value) => {
    if (!value) {
      return "Recently added";
    }

    try {
      if (value?.toDate) {
        return value.toDate().toLocaleString("en-PH");
      }

      if (value?.seconds) {
        return new Date(
          value.seconds * 1000
        ).toLocaleString("en-PH");
      }

      if (typeof value === "string") {
        return value;
      }

      return "Recently added";
    } catch {
      return "Recently added";
    }
  };

  return (
    <div
      className="modal-overlay pinned-messages-overlay"
      onClick={onClose}
    >
      <div
        className="pinned-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="pinned-modal-header">
          <div>
            <div className="modal-label">
              IMPORTANT
            </div>

            <h2>
              Pinned Messages
            </h2>

            <p>
              Important announcements and knowledge resources.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* TWO COLUMNS */}
        <div className="pinned-half-grid">

          {/* =====================================
              ANNOUNCEMENTS
          ===================================== */}
          <section className="pinned-column">

            <div className="pinned-column-header">
              <div className="pinned-column-icon">
                📢
              </div>

              <div>
                <span>
                  ANNOUNCEMENTS
                </span>

                <h2>
                  Pinned Announcements
                </h2>

                <p>
                  Important company updates
                </p>
              </div>
            </div>

            <div className="pinned-column-divider" />

            <div className="pinned-list">

              {announcements.length === 0 ? (

                <div className="pinned-empty-state">
                  <div className="pinned-empty-icon">
                    📢
                  </div>

                  <h3>
                    No Pinned Announcements
                  </h3>

                  <p>
                    Important announcements you pin will appear here.
                  </p>
                </div>

              ) : (

                announcements.map((item) => (

                  <article
                    className="pinned-message-card"
                    key={item.id}
                  >

                    <div className="pinned-card-top">

                      <span className="pinned-badge">
                        📌 ANNOUNCEMENT
                      </span>

                      <button
                        type="button"
                        className="unpin-button"
                        onClick={() =>
                          onUnpinAnnouncement?.(
                            item.id
                          )
                        }
                      >
                        Unpin
                      </button>

                    </div>

                    <h3 className="pinned-message-name">
                      {typeof item.title === "string"
                        ? item.title
                        : "Untitled Announcement"}
                    </h3>

                    {typeof item.imageUrl === "string" &&
                      item.imageUrl.trim() !== "" && (
                        <img
                          src={item.imageUrl}
                          alt={
                            typeof item.title === "string"
                              ? item.title
                              : "Announcement"
                          }
                          className="pinned-announcement-image"
                        />
                      )}

                    <div className="pinned-message-details">
                      {getDetails(item)}
                    </div>

                    <div className="pinned-message-meta">

                      <div className="pinned-by">
                        <span className="pinned-by-icon">
                          👤
                        </span>

                        <span>
                          Pinned by:
                          <strong>
                            {" "}
                            {typeof item.pinnedBy === "string" &&
                            item.pinnedBy.trim()
                              ? item.pinnedBy
                              : "Unknown"}
                          </strong>
                        </span>
                      </div>

                      <div className="pinned-date">
                        🕒{" "}
                        {formatDate(
                          item.pinnedDate ||
                            item.createdAt
                        )}
                      </div>

                    </div>

                    {item.pinnedDate && (
                      <div className="pin-date">
                        📌 Pinned on{" "}
                        {formatDate(
                          item.pinnedDate
                        )}
                      </div>
                    )}

                  </article>

                ))
              )}

            </div>
          </section>

          {/* =====================================
              KNOWLEDGE
          ===================================== */}
          <section className="pinned-column">

            <div className="pinned-column-header">

              <div className="pinned-column-icon">
                📖
              </div>

              <div>
                <span>
                  KNOWLEDGE
                </span>

                <h2>
                  Pinned Knowledge
                </h2>

                <p>
                  Important resources and information
                </p>
              </div>

            </div>

            <div className="pinned-column-divider" />

            <div className="pinned-list">

              {knowledge.length === 0 ? (

                <div className="pinned-empty-state">

                  <div className="pinned-empty-icon">
                    📖
                  </div>

                  <h3>
                    No Pinned Knowledge
                  </h3>

                  <p>
                    Important knowledge resources you pin will appear here.
                  </p>

                </div>

              ) : (

                knowledge.map((item) => (

                  <article
                    className={`pinned-message-card ${
                      item.pinned
                        ? "pinned-knowledge-card"
                        : ""
                    }`}
                    key={item.id}
                  >

                    {/* TOP */}
                    <div className="pinned-card-top">

                      <span className="pinned-badge">
                        📌 KNOWLEDGE
                      </span>

                      <button
                        type="button"
                        className="unpin-button"
                        onClick={() =>
                          onUnpinKnowledge?.(
                            item.id
                          )
                        }
                      >
                        Unpin
                      </button>

                    </div>

                    {/* TITLE */}
                    <h3 className="pinned-message-name">
                      {typeof item.title === "string"
                        ? item.title
                        : "Untitled Knowledge"}
                    </h3>

                    {/* KNOWLEDGE CONTENT */}
                    <div className="pinned-message-details pinned-knowledge-details">
                      {getDetails(item)}
                    </div>

                    {/* META INFORMATION */}
                    <div className="pinned-message-meta">

                      <div className="pinned-by">

                        <span className="pinned-by-icon">
                          👤
                        </span>

                        <span>
                          Pinned by:
                          <strong>
                            {" "}
                            {typeof item.pinnedBy === "string" &&
                            item.pinnedBy.trim()
                              ? item.pinnedBy
                              : "Unknown"}
                          </strong>
                        </span>

                      </div>

                      <div className="pinned-date">
                        🕒{" "}
                        {formatDate(
                          item.pinnedDate ||
                            item.createdAt
                        )}
                      </div>

                    </div>

                    {/* PIN DATE */}
                    {item.pinnedDate && (
                      <div className="pin-date">
                        📌 Pinned on{" "}
                        {formatDate(
                          item.pinnedDate
                        )}
                      </div>
                    )}

                  </article>

                ))
              )}

            </div>

          </section>

        </div>
      </div>
    </div>
  );
}