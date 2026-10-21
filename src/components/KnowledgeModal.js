import React, {
  useEffect,
  useState,
} from "react";

export default function KnowledgeModal({
  show,
  search,
  setSearch,
  results = [],
  loading,
  onClose,
}) {
  const [submittedSearch, setSubmittedSearch] =
    useState("");

  useEffect(() => {
    if (!show) {
      setSubmittedSearch("");
    }
  }, [show]);

  if (!show) return null;

  const handleSearch = () => {
    setSubmittedSearch(search.trim());
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const displayResults =
    submittedSearch.trim().length > 0;

  return (
    <div className="modal-overlay">

      <div className="modal knowledge-modal">

        {/* HEADER */}

        <div className="modal-top">

          <div>

            <span className="modal-label">
              KNOWLEDGE SEARCH
            </span>

            <h2>
              Knowledge Hub
            </h2>

            <p>
              Search the Walastik knowledge base
              for information and answers.
            </p>

          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>

        {/* SEARCH */}

        <div className="knowledge-search-area">

          <div className="knowledge-search-box">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              value={search}
              placeholder="Ask or search anything..."
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={handleKeyDown}
              autoFocus
            />

            {search && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          <button
            className="knowledge-search-button"
            onClick={handleSearch}
          >
            Search
          </button>

        </div>

        {/* INITIAL STATE */}

        {!displayResults && (
          <div className="knowledge-welcome">

            <div className="welcome-icon">
              📚
            </div>

            <h3>
              Search the Knowledge Hub
            </h3>

            <p>
              Enter a question or keyword to find
              information in the Walastik knowledge
              base.
            </p>

            <div className="search-examples">

              <span>
                Try searching:
              </span>

              <button
                onClick={() =>
                  setSearch("company policy")
                }
              >
                Company Policy
              </button>

              <button
                onClick={() =>
                  setSearch("services")
                }
              >
                Services
              </button>

              <button
                onClick={() =>
                  setSearch("procedures")
                }
              >
                Procedures
              </button>

            </div>

          </div>
        )}

        {/* RESULTS */}

        {displayResults && (

          <div className="knowledge-results">

            <div className="results-title">

              {loading ? (
                <p>
                  Searching knowledge base...
                </p>
              ) : (
                <p>
                  {results.length} result
                  {results.length !== 1 ? "s" : ""}
                  {" "}found for "
                  <strong>
                    {submittedSearch}
                  </strong>
                  "
                </p>
              )}

            </div>

            {loading && (
              <div className="loading-state">
                Loading...
              </div>
            )}

            {!loading &&
              results.length === 0 && (

              <div className="empty-results">

                <div>
                  🔎
                </div>

                <h3>
                  No results found
                </h3>

                <p>
                  Try another keyword or question.
                </p>

              </div>

            )}

            {!loading &&
              results.map((item) => (

                <article
                  className="knowledge-result-card"
                  key={item.id}
                >

                  <div className="result-book-icon">
                    📖
                  </div>

                  <div className="result-content">

                    <h3>
                      {item.title ||
                        "Untitled Knowledge"}
                    </h3>

                    <p>
                      {item.details ||
                        "No information available."}
                    </p>

                    {item.date && (
                      <small>
                        🗓 {item.date}
                      </small>
                    )}

                  </div>

                  {item.pinned && (
                    <div className="result-pin">
                      📌
                    </div>
                  )}

                </article>

              ))}

          </div>

        )}

      </div>

    </div>
  );
}