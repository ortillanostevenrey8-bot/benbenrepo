import React, { useMemo, useState } from "react";

function KnowledgeDashboard({
  knowledge = [],
  loading = false,
  onOpen,
}) {
  const [search, setSearch] = useState("");

  // =========================================================
  // GET TITLE
  // =========================================================
  const getKnowledgeTitle = (item) => {
    return String(
      item.title ||
        item.question ||
        item.name ||
        "Knowledge Resource"
    );
  };

  // =========================================================
  // GET CONTENT
  // =========================================================
  const getKnowledgeContent = (item) => {
    return String(
      item.content ||
        item.details ||
        item.answer ||
        item.response ||
        item.text ||
        ""
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================
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

  // =========================================================
  // SEARCH KNOWLEDGE
  // =========================================================
  const filteredKnowledge = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    if (!cleanSearch) {
      return knowledge;
    }

    return knowledge.filter((item) => {
      const title =
        getKnowledgeTitle(item).toLowerCase();

      const content =
        getKnowledgeContent(item).toLowerCase();

      return (
        title.includes(cleanSearch) ||
        content.includes(cleanSearch)
      );
    });
  }, [knowledge, search]);

  // =========================================================
  // SHORTEN CONTENT
  // =========================================================
  const createExcerpt = (text) => {
    const cleanText = String(text)
      .replace(/\*\*/g, "")
      .replace(/#{1,6}\s?/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length <= 180) {
      return cleanText;
    }

    return `${cleanText.substring(0, 180)}...`;
  };

  return (
    <section className="panel knowledge-dashboard-card">

      {/* ===================================================
          HEADER
      =================================================== */}
      <div className="knowledge-dashboard-header">

        <div>

          <div className="panel-label">
            K N O W L E D G E &nbsp; H U B
          </div>

          <h2>
            Knowledge Hub
          </h2>

          <p>
            Search for information and company
            resources.
          </p>

        </div>

        <button
          type="button"
          className="knowledge-open-button"
          onClick={onOpen}
        >
          Open
        </button>

      </div>

      {/* ===================================================
          SEARCH
      =================================================== */}
      <div className="knowledge-search-wrap">

        <span className="search-icon">
          ⌕
        </span>

        <input
          type="text"
          className="knowledge-search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search knowledge..."
        />

      </div>

      <div className="panel-divider" />

      {/* ===================================================
          FEATURED RESOURCES
      =================================================== */}
      <div className="knowledge-dashboard-content">

        <div className="knowledge-section-heading">
          <h3>
            Featured Resources
          </h3>

          <span>
            {filteredKnowledge.length} resource
            {filteredKnowledge.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="knowledge-preview-scroll">

          {loading ? (
            <div className="loading-state">
              Loading knowledge...
            </div>
          ) : filteredKnowledge.length === 0 ? (
            <div className="empty-state">
              No knowledge resources found.
            </div>
          ) : (
            filteredKnowledge
              .slice(0, 5)
              .map((item) => {

                const title =
                  getKnowledgeTitle(item);

                const content =
                  getKnowledgeContent(item);

                const date = formatDate(
                  item.createdAt ||
                    item.createdDate ||
                    item.date
                );

                return (
                  <article
                    key={item.id}
                    className="knowledge-preview-card"
                  >

                    <div className="knowledge-card-title-row">

                      <h3>
                        {title}
                      </h3>

                    </div>

                    <p>
                      {createExcerpt(content)}
                    </p>

                    {date && (
                      <div className="knowledge-card-meta">
                        {date}
                      </div>
                    )}

                  </article>
                );
              })
          )}

        </div>

      </div>

      {/* ===================================================
          OPEN FULL KNOWLEDGE HUB
      =================================================== */}
      <button
        type="button"
        className="knowledge-view-all-button"
        onClick={onOpen}
      >
        View All Knowledge
        <span>›</span>
      </button>

    </section>
  );
}

export default KnowledgeDashboard;