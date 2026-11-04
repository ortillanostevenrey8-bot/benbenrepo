import React from "react";

export default function AnnouncementListModal({
  announcements,
  onClose,
  onPin,
  onEdit,
  onDelete,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal announcement-modal">
        <div className="modal-top">
          <div>
            <div className="modal-label">ANNOUNCEMENTS</div>
            <h2>All Announcements</h2>
            <p>View and manage all company announcements.</p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="announcement-list">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div
                className="announcement-card"
                key={announcement.id}
              >
                <div>
                  <div className="announcement-title-row">
                    <h3>{announcement.title}</h3>

                    {announcement.pinned && (
                      <span className="pinned-badge">
                        📌 PINNED
                      </span>
                    )}
                  </div>

                  <p>{announcement.details}</p>

                  <small>
                    🕒 {announcement.date}
                  </small>
                </div>

                <div className="announcement-actions">
                  <button
                    type="button"
                    onClick={() => onPin(announcement.id)}
                    title="Pin announcement"
                  >
                    📌
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(announcement)}
                    title="Edit announcement"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => onDelete(announcement.id)}
                    title="Delete announcement"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div>📢</div>
              <h3>No announcements yet</h3>
              <p>Announcements will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}