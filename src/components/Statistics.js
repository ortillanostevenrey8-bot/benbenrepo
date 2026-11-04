import React from "react";

const cards = [
  { key: "announcements", title: "Announcements", detail: "Latest company updates", action: "View Updates" },
  { key: "knowledge", title: "Knowledge", detail: "Company resources", action: "Explore Knowledge" },
  { key: "pinned", title: "Pinned", detail: "Important information", action: "View Pinned" },
  { key: "users", title: "Total Users", detail: "Registered user accounts", action: "User accounts" },
  { key: "admins", title: "Admins", detail: "Administrator accounts", action: "View admins" },
];

function SummaryIcon({ type }) {
  if (type === "announcements") return <svg viewBox="0 0 24 24"><path d="M3 10v4h4l10 5V5L7 10H3Z" /><path d="m7 14 2 6h4l-2.6-4.7M20 9a5 5 0 0 1 0 6" /></svg>;
  if (type === "knowledge") return <svg viewBox="0 0 24 24"><path d="M12 6.5C9.8 4.8 6.4 4.5 3 5.5v14c3.4-1 6.8-.7 9 1 2.2-1.7 5.6-2 9-1v-14c-3.4-1-6.8-.7-9 1Z" /><path d="M12 6.5v14" /></svg>;
  if (type === "users") return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20ZM16 5a3.5 3.5 0 0 1 0 6.8M18 14a5 5 0 0 1 3.5 4.8V20" /></svg>;
  if (type === "admins") return <svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  return <svg viewBox="0 0 24 24"><path d="m12 21 1.5-7.5 6-6a5 5 0 0 0-7-7l-6 6L12 21Z" /><path d="m6.5 6.5 7 7" /></svg>;
}

export default function Statistics({
  isAdmin = false,
  totalUsers = 0,
  totalAdmins = 0,
  totalUpdates = 0,
  knowledgeArticles = 0,
  pinnedMessages = 0,
  onOpenAnnouncements,
  onOpenKnowledge,
  onOpenPinned,
  onOpenUsers,
}) {
  const visibleCards = isAdmin ? cards : cards.slice(0, 3);
  const values = { announcements: totalUpdates, knowledge: knowledgeArticles, pinned: pinnedMessages, users: totalUsers, admins: totalAdmins };
  const actions = { announcements: onOpenAnnouncements, knowledge: onOpenKnowledge, pinned: onOpenPinned, users: onOpenUsers, admins: onOpenUsers };

  return (
    <section className={`statistics-grid${isAdmin ? " has-user-count" : ""}`} aria-label="Information center summary">
      {visibleCards.map((card) => (
        <button type="button" key={card.key} className={`stat-card stat-card-button stat-${card.key}`} onClick={actions[card.key]}>
          <span className="stat-icon" aria-hidden="true"><SummaryIcon type={card.key} /></span>
          <span className="stat-title">{card.title}</span>
          <span className="stat-number">{values[card.key]}</span>
          <span className="stat-description">{card.detail}</span>
          <span className="stat-action">{card.action} →</span>
        </button>
      ))}
    </section>
  );
}
