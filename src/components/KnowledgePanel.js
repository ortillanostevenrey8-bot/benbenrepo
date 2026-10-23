import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../pages/firebase/firebase";
import ConfirmDialog from "./ConfirmDialog";
import { searchWalastikWebsite } from "../Services/walastikWebsiteSearch";
import "./KnowledgePanel.css";

const WALASTIK_SOURCE_URLS = [
  "https://walastik.bfdenterprises.com/",
  "https://walastik.bfdenterprises.com/about",
  "https://walastik.bfdenterprises.com/branches",
  "https://walastik.bfdenterprises.com/troubleshoot",
];

export default function KnowledgePanel({
  isAdmin = false,
  onClose,
  onPin,
  onUnpin,
  pinningId,
}) {
  /* =========================================================
     KNOWLEDGE
  ========================================================= */

  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     NORMAL KNOWLEDGE SEARCH
  ========================================================= */

  const [search, setSearch] = useState("");

  /* =========================================================
     SELECTED KNOWLEDGE
  ========================================================= */

  const [selectedKnowledge, setSelectedKnowledge] =
    useState(null);

  /* =========================================================
     AI QUESTION
  ========================================================= */

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [privateWebsiteResults, setPrivateWebsiteResults] = useState([]);

  /* =========================================================
     ADD KNOWLEDGE
  ========================================================= */

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  /* =========================================================
     DELETE
  ========================================================= */

  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================================================
     AI PIN MODAL
  ========================================================= */

  const [showAIPinModal, setShowAIPinModal] =
    useState(false);

  const [aiPinnerName, setAIPinnerName] =
    useState("");

  const [selectedAIForPin, setSelectedAIForPin] =
    useState(null);

  const [aiPinningId, setAIPinningId] =
    useState(null);

  /* =========================================================
     FIRESTORE KNOWLEDGE LISTENER
  ========================================================= */

  useEffect(() => {
    setLoading(true);

    const knowledgeRef =
      collection(db, "knowledge");

    const unsubscribe = onSnapshot(
      knowledgeRef,
      (snapshot) => {
        const data = snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );

        /* ==============================================
           SORT

           Pinned first.
           Then newest first.
        ============================================== */

        data.sort((a, b) => {
          if (
            a.pinned &&
            !b.pinned
          ) {
            return -1;
          }

          if (
            !a.pinned &&
            b.pinned
          ) {
            return 1;
          }

          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;
        });

        setKnowledge(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Knowledge listener error:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    try {
      let date;

      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (
        timestamp instanceof Date
      ) {
        date = timestamp;
      } else if (
        timestamp?.seconds
      ) {
        date = new Date(
          timestamp.seconds * 1000
        );
      } else {
        date = new Date(timestamp);
      }

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleString(
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

  /* =========================================================
     OPEN KNOWLEDGE DETAIL
  ========================================================= */

  const handleOpenKnowledge = (
    item
  ) => {
    if (!item) {
      return;
    }

    setSelectedKnowledge(item);
  };

  /* =========================================================
     CLOSE KNOWLEDGE DETAIL
  ========================================================= */

  const handleCloseKnowledge = () => {
    setSelectedKnowledge(null);
  };

  /* =========================================================
     ADD COMPANY KNOWLEDGE
  ========================================================= */

  const handleAddKnowledge =
    async (event) => {
      event.preventDefault();

      if (
        !title.trim() ||
        !details.trim() ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);

        await addDoc(
          collection(
            db,
            "knowledge"
          ),
          {
            title:
              title.trim(),

            details:
              details.trim(),

            pinned: false,

            pinnedBy: "",

            pinnedAt: null,

            source:
              "company",

            createdAt:
              serverTimestamp(),
          }
        );

        setTitle("");
        setDetails("");
        setShowAddForm(false);
      } catch (error) {
        console.error(
          "Add knowledge error:",
          error
        );

        alert(
          "Unable to add knowledge."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     DELETE KNOWLEDGE
  ========================================================= */

  const handleDeleteKnowledge = (item) => {
    if (!item?.id || deletingId) return;
    setDeleteTarget(item);
  };

  const confirmDeleteKnowledge = async () => {
    const item = deleteTarget;
    if (!item?.id || deletingId) return;

    try {
      setDeletingId(item.id);

      await deleteDoc(
        doc(
          db,
          "knowledge",
          item.id
        )
      );

      if (selectedKnowledge?.id === item.id) {
        setSelectedKnowledge(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Delete knowledge error:",
        error
      );

      alert(
        "Unable to delete this knowledge."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     NORMAL KNOWLEDGE PIN
  ========================================================= */

  const handleKnowledgePinClick =
    (item) => {
      if (!item?.id) {
        return;
      }

      if (item.pinned) {
        if (onUnpin) {
          onUnpin(item);
        }

        return;
      }

      if (onPin) {
        onPin(item);
      }
    };

  /* =========================================================
     OFFICIAL WEBSITE SEARCH
  ========================================================= */

  const askAI = async () => {
    const question =
      aiQuestion.trim();

    if (
      !question ||
      aiLoading
    ) {
      return;
    }

    setAiError("");

    try {
      setAiLoading(true);
      const websiteMatches = searchWalastikWebsite(question);
      if (websiteMatches.length === 0) {
        setAiError(
          "I couldn't find that information on the official Walastik pages indexed here. Check the website directly or contact support@bfdenterprises.com."
        );
        return;
      }

      setPrivateWebsiteResults((results) => [
        ...websiteMatches.map((match, index) => ({
          id: `website-${Date.now()}-${index}`,
          title: match.title,
          answer: match.details,
          details: match.details,
          question,
          source: "ai",
          sourceType: "website",
          sourceUrls: match.sourceUrls,
          pinned: false,
          pinnedBy: "",
          pinnedAt: null,
          createdAt: new Date(),
          privateResult: true,
        })),
        ...results,
      ]);
      setAiQuestion("");
    } catch (error) {
      console.error("Official website search error:", error);
      setAiError("The official website search failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  /* =========================================================
     OPEN AI PIN MODAL

     This now receives the SPECIFIC AI result.
  ========================================================= */

  const openAIPinModal =
    (item) => {
      if (
        !item ||
        !item.id ||
        !item.details
      ) {
        return;
      }

      setSelectedAIForPin(item);

      setAIPinnerName(
        item.pinnedBy || ""
      );

      setShowAIPinModal(true);
    };

  /* =========================================================
     CLOSE AI PIN MODAL
  ========================================================= */

  const closeAIPinModal = () => {
    if (aiPinningId) {
      return;
    }

    setShowAIPinModal(false);
    setAIPinnerName("");
    setSelectedAIForPin(null);
  };

  /* =========================================================
     PIN SPECIFIC AI RESULT

     Each AI result gets its OWN pin.
  ========================================================= */

  const saveAIPin = async (
    event
  ) => {
    event.preventDefault();

    if (
      !selectedAIForPin?.id ||
      !aiPinnerName.trim() ||
      aiPinningId
    ) {
      return;
    }

    try {
      setAIPinningId(
        selectedAIForPin.id
      );

      if (selectedAIForPin.privateResult) {
        await addDoc(collection(db, "knowledge"), {
          title: selectedAIForPin.question,
          answer: selectedAIForPin.answer,
          details: selectedAIForPin.details,
          question: selectedAIForPin.question,
          source: "ai",
          sourceType: selectedAIForPin.sourceType,
          sourceUrls: selectedAIForPin.sourceUrls,
          pinned: true,
          pinnedBy: aiPinnerName.trim(),
          pinnedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        setPrivateWebsiteResults((results) =>
          results.filter((item) => item.id !== selectedAIForPin.id)
        );
      } else {
        await updateDoc(
          doc(db, "knowledge", selectedAIForPin.id),
          {
            pinned: true,
            pinnedBy: aiPinnerName.trim(),
            pinnedAt: serverTimestamp(),
            source: "ai",
          }
        );
      }

      setShowAIPinModal(false);
      setAIPinnerName("");
      setSelectedAIForPin(null);
    } catch (error) {
      console.error(
        "AI pin error:",
        error
      );

      alert(
        "Unable to pin the AI answer."
      );
    } finally {
      setAIPinningId(null);
    }
  };

  /* =========================================================
     UNPIN SPECIFIC AI RESULT

     IMPORTANT:
     This only unpins THIS result.
     Other research stays pinned.
  ========================================================= */

  const unpinAI = async (
    item
  ) => {
    if (
      !item?.id ||
      aiPinningId
    ) {
      return;
    }

    try {
      setAIPinningId(item.id);

      await updateDoc(
        doc(
          db,
          "knowledge",
          item.id
        ),
        {
          pinned: false,

          pinnedBy: "",

          pinnedAt: null,
        }
      );
    } catch (error) {
      console.error(
        "AI unpin error:",
        error
      );

      alert(
        "Unable to unpin the AI answer."
      );
    } finally {
      setAIPinningId(null);
    }
  };

  /* =========================================================
     FILTER COMPANY KNOWLEDGE

     AI research is kept separate so ALL AI research
     remains visible.
  ========================================================= */

  const filteredKnowledge =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      const companyKnowledge =
        knowledge.filter(
          (item) =>
            item.source !== "ai"
        );

      if (!cleanSearch) {
        return companyKnowledge;
      }

      return companyKnowledge.filter(
        (item) => {
          const titleText =
            item.title || "";

          const detailsText =
            item.details || "";

          const pinnedByText =
            item.pinnedBy || "";

          return (
            titleText
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            detailsText
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            pinnedByText
              .toLowerCase()
              .includes(
                cleanSearch
              )
          );
        }
      );
    }, [
      knowledge,
      search,
    ]);

  /* =========================================================
     OFFICIAL WEBSITE RESULTS AND PINNED ANSWERS
  ========================================================= */

  const aiResearch =
    useMemo(() => {
      const pinnedResults = knowledge
        .filter(
          (item) =>
            item.source === "ai" && item.pinned
        )
        .sort((a, b) => {
          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;
        });

      return [...privateWebsiteResults, ...pinnedResults];
    }, [knowledge, privateWebsiteResults]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div className="knowledge-overlay">
        <div className="knowledge-panel">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="knowledge-sticky-top">
          <div className="knowledge-header">
            <div>
              <span className="knowledge-label">
                WALASTIK INFORMATION CENTER
              </span>

              <h1>
                Knowledge
              </h1>

              <p>
                View and manage useful
                information and
                AI-generated knowledge.
              </p>
            </div>

            <button
              type="button"
              className="knowledge-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* =================================================
              NORMAL KNOWLEDGE SEARCH
          ================================================= */}

          <div className="knowledge-search">
            <div className="knowledge-search-input">
              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search knowledge..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>
          </div>
          </div>

          {/* =================================================
              TOOLBAR
          ================================================= */}

          {isAdmin && <div className="knowledge-toolbar">
            <button
              type="button"
              className="add-knowledge-button"
              onClick={() => {
                setShowAddForm(
                  (value) => !value
                );

                if (showAddForm) {
                  setTitle("");
                  setDetails("");
                }
              }}
            >
              {showAddForm
                ? "Close"
                : "Add Knowledge"}
            </button>
          </div>}

          {/* =================================================
              ADD KNOWLEDGE
          ================================================= */}

          {isAdmin && showAddForm && (
            <form
              className="knowledge-add-form"
              onSubmit={
                handleAddKnowledge
              }
            >
              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Knowledge title..."
                disabled={saving}
              />

              <textarea
                value={details}
                onChange={(event) =>
                  setDetails(
                    event.target.value
                  )
                }
                placeholder="Knowledge details..."
                disabled={saving}
              />

              <button
                type="submit"
                disabled={
                  saving ||
                  !title.trim() ||
                  !details.trim()
                }
              >
                {saving
                  ? "Saving..."
                  : "Save Knowledge"}
              </button>
            </form>
          )}

          <div className="knowledge-divider" />

          {/* =================================================
              OFFICIAL WEBSITE SEARCH
          ================================================= */}

          <section className="knowledge-section">

            <div className="knowledge-section-header">
              <div>
                <span className="knowledge-section-label">
                  OFFICIAL WALASTIK WEBSITE
                </span>

                <h2>
                  Search official Walastik information
                </h2>

                <p>
                  Search verified information and guides from the official Walastik website.
                </p>
              </div>
            </div>

            {/* AI QUESTION */}

            <div className="knowledge-search">
              <div className="knowledge-search-input">
                <input
                  type="text"
                  placeholder="Search Walastik company info, branches, or support guides..."
                  value={aiQuestion}
                  onChange={(event) =>
                    setAiQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      askAI();
                    }
                  }}
                  disabled={aiLoading}
                />
              </div>

              <button
                type="button"
                className="knowledge-search-button"
                onClick={askAI}
                disabled={
                  aiLoading ||
                  !aiQuestion.trim()
                }
              >
                {aiLoading
                  ? "Searching..."
                  : "Search official website"}
              </button>
            </div>

            {aiError && (
              <p className="ai-scope-notice" role="alert">
                {aiError}
              </p>
            )}

            {/* =================================================
                AI LOADING
            ================================================= */}

            {aiLoading && (
              <div className="knowledge-card ai-loading-card">
                <div className="ai-loading-logo">
                  W
                </div>

                <div>
                  <strong>
                    Searching...
                  </strong>

                  <p>
                    the official Walastik pages.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                WEBSITE RESULTS
            ================================================= */}

            {!aiLoading &&
              aiResearch.length > 0 && (
                <div className="knowledge-list">

                  {aiResearch.map(
                    (item) => (
                      <article
                        key={item.id}
                        className={`knowledge-card knowledge-card-clickable ai-answer-card ${
                          item.pinned
                            ? "knowledge-card-pinned"
                            : ""
                        }`}
                        onClick={() =>
                          handleOpenKnowledge(
                            item
                          )
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();

                            handleOpenKnowledge(
                              item
                            );
                          }
                        }}
                      >

                        {/* HEADER */}

                        <div className="knowledge-card-top">
                          <div>

                            <span className="knowledge-pinned-badge">
                              {item.pinned
                                ? "PINNED"
                                : item.sourceType === "website"
                                  ? "OFFICIAL WEBSITE"
                                  : "AI RESEARCH"}
                            </span>

                            <h3>
                              {item.sourceType === "website"
                                ? item.title
                                : item.question || item.title || "AI Knowledge"}
                            </h3>

                          </div>
                        </div>

                        {/* ANSWER */}

                        <div className="knowledge-card-content ai-answer-content">
                          {item.details ||
                            "No answer available."}
                        </div>

                        <div className="ai-source-links" onClick={(event) => event.stopPropagation()}>
                          <span>Official Walastik sources:</span>
                          {(item.sourceUrls || WALASTIK_SOURCE_URLS).map((url) => {
                            const sourceName = url.includes("/about") ? "About" : url.includes("/branches") ? "Branches" : url.includes("/troubleshoot") ? "Troubleshooting" : "Walastik Internet";
                            return <a href={url} key={url} target="_blank" rel="noreferrer">{sourceName}</a>;
                          })}
                        </div>

                        {/* DATE */}

                        {item.createdAt && (
                          <div className="knowledge-card-date">
                            Matched:{" "}
                            <strong>
                              {formatDate(
                                item.createdAt
                              )}
                            </strong>
                          </div>
                        )}

                        {/* ACTIONS */}

                        <div
                          className="knowledge-card-actions"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >

                          {item.pinned ? (
                            <button
                              type="button"
                              className="knowledge-unpin-button"
                              disabled={
                                aiPinningId ===
                                item.id
                              }
                              onClick={(event) => {
                                event.stopPropagation();

                                unpinAI(
                                  item
                                );
                              }}
                            >
                              {aiPinningId ===
                              item.id
                                ? "Saving..."
                                : "Unpin"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="knowledge-pin-button"
                              disabled={
                                aiPinningId ===
                                item.id
                              }
                              onClick={(event) => {
                                event.stopPropagation();

                                openAIPinModal(
                                  item
                                );
                              }}
                            >
                              Pin
                            </button>
                          )}

                          <button
                            type="button"
                            className="knowledge-delete-button"
                            disabled={deletingId === item.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (item.privateResult) {
                                setPrivateWebsiteResults((results) =>
                                  results.filter((result) => result.id !== item.id)
                                );
                              } else {
                                handleDeleteKnowledge(item);
                              }
                            }}
                          >
                            {deletingId === item.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                        {/* PIN INFORMATION */}

                        {item.pinned &&
                          item.pinnedBy && (
                            <div
                              className="knowledge-pin-info"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              Pinned by{" "}
                              <strong>
                                {
                                  item.pinnedBy
                                }
                              </strong>

                              {item.pinnedAt && (
                                <>
                                  {" • "}
                                  {formatDate(
                                    item.pinnedAt
                                  )}
                                </>
                              )}
                            </div>
                          )}

                      </article>
                    )
                  )}

                </div>
              )}

          </section>

          {/* =================================================
              WALASTIK COMPANY KNOWLEDGE
          ================================================= */}

          <section className="knowledge-section">

            <div className="knowledge-section-header">
              <div>
                <span className="knowledge-section-label">
                  WALASTIK KNOWLEDGE
                </span>

                <h2>
                  Information
                </h2>

                <p>
                  Company knowledge and
                  useful information.
                </p>
              </div>
            </div>

            <div className="knowledge-list">

              {loading ? (
                <div className="knowledge-card">
                  Loading knowledge...
                </div>
              ) : filteredKnowledge.length ===
                0 ? (
                <div className="knowledge-card ai-empty-card">
                  {search.trim()
                    ? "No knowledge matches your search."
                    : "No company knowledge available yet."}
                </div>
              ) : (
                filteredKnowledge.map(
                  (item) => (
                    <article
                      key={item.id}
                      className={`knowledge-card knowledge-card-clickable ${
                        item.pinned
                          ? "knowledge-card-pinned"
                          : ""
                      }`}
                      onClick={() =>
                        handleOpenKnowledge(
                          item
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key ===
                            " "
                        ) {
                          event.preventDefault();

                          handleOpenKnowledge(
                            item
                          );
                        }
                      }}
                    >

                      <div className="knowledge-card-top">
                        <div>

                          {item.pinned && (
                            <span className="knowledge-pinned-badge">
                              PINNED
                            </span>
                          )}

                          <h3>
                            {item.title ||
                              "Untitled Knowledge"}
                          </h3>

                        </div>
                      </div>

                      <div className="knowledge-card-content">
                        {item.details ||
                          "No details available."}
                      </div>

                      {item.createdAt && (
                        <div className="knowledge-card-date">
                          Created:{" "}
                          <strong>
                            {formatDate(
                              item.createdAt
                            )}
                          </strong>
                        </div>
                      )}

                      <div
                        className="knowledge-card-actions"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >

                        <button
                          type="button"
                          className={
                            item.pinned
                              ? "knowledge-unpin-button"
                              : "knowledge-pin-button"
                          }
                          disabled={
                            pinningId ===
                            item.id
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            handleKnowledgePinClick(
                              item
                            );
                          }}
                        >
                          {pinningId ===
                          item.id
                            ? "Saving..."
                            : item.pinned
                            ? "Unpin"
                            : "Pin"}
                        </button>

                        <button
                          type="button"
                          className="knowledge-delete-button"
                          disabled={
                            deletingId ===
                            item.id
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            handleDeleteKnowledge(
                              item
                            );
                          }}
                        >
                          {deletingId ===
                          item.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                      {item.pinned &&
                        item.pinnedBy && (
                          <div
                            className="knowledge-pin-info"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            Pinned by{" "}
                            <strong>
                              {
                                item.pinnedBy
                              }
                            </strong>

                            {item.pinnedAt && (
                              <>
                                {" • "}
                                {formatDate(
                                  item.pinnedAt
                                )}
                              </>
                            )}
                          </div>
                        )}

                    </article>
                  )
                )
              )}

            </div>
          </section>

        </div>
      </div>

      {/* =====================================================
          KNOWLEDGE DETAIL SIDE SCREEN
      ===================================================== */}

      {selectedKnowledge && (
        <div
          className="knowledge-detail-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseKnowledge();
            }
          }}
        >

          <aside
            className="knowledge-detail-panel"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="knowledge-detail-header">

              <div>

                <span className="knowledge-detail-label">
                  {selectedKnowledge.source ===
                  "ai"
                    ? "AI KNOWLEDGE"
                    : "WALASTIK KNOWLEDGE"}
                </span>

                <h2>
                  Knowledge Details
                </h2>

              </div>

              <button
                type="button"
                className="knowledge-detail-close"
                onClick={
                  handleCloseKnowledge
                }
              >
                ×
              </button>

            </div>

            <div className="knowledge-detail-content">

              {selectedKnowledge.pinned && (
                <span className="knowledge-pinned-badge knowledge-detail-pinned">
                  PINNED
                </span>
              )}

              <h1>
                {selectedKnowledge.title ||
                  selectedKnowledge.question ||
                  "Untitled Knowledge"}
              </h1>

              {selectedKnowledge.source ===
                "ai" &&
                selectedKnowledge.question && (
                  <div className="knowledge-detail-question">

                    <span>
                      Question
                    </span>

                    <p>
                      {
                        selectedKnowledge.question
                      }
                    </p>

                  </div>
                )}

              <div className="knowledge-detail-divider" />

              <div className="knowledge-detail-message">
                {selectedKnowledge.details ||
                  "No details available."}
              </div>

              {(selectedKnowledge.source === "ai" || selectedKnowledge.sourceType === "website") && (
                <div className="ai-source-links ai-detail-source-links">
                  <span>Official Walastik sources:</span>
                  {(selectedKnowledge.sourceUrls || WALASTIK_SOURCE_URLS).map((url) => {
                    const sourceName = url.includes("/about") ? "About" : url.includes("/branches") ? "Branches" : url.includes("/troubleshoot") ? "Troubleshooting" : "Walastik Internet";
                    return <a href={url} key={url} target="_blank" rel="noreferrer">{sourceName}</a>;
                  })}
                </div>
              )}

              {selectedKnowledge.createdAt && (
                <div className="knowledge-detail-date">

                  <span>
                    Matched / Created
                  </span>

                  <strong>
                    {formatDate(
                      selectedKnowledge.createdAt
                    )}
                  </strong>

                </div>
              )}

              {selectedKnowledge.pinned &&
                selectedKnowledge.pinnedBy && (
                  <div className="knowledge-detail-pin-info">

                    <span>
                      Pinned by
                    </span>

                    <strong>
                      {
                        selectedKnowledge.pinnedBy
                      }
                    </strong>

                    {selectedKnowledge.pinnedAt && (
                      <small>
                        {formatDate(
                          selectedKnowledge.pinnedAt
                        )}
                      </small>
                    )}

                  </div>
                )}

            </div>

            <div className="knowledge-detail-actions">

              {selectedKnowledge.source ===
              "ai" ? (

                selectedKnowledge.pinned ? (

                  <button
                    type="button"
                    className="knowledge-unpin-button"
                    disabled={
                      aiPinningId ===
                      selectedKnowledge.id
                    }
                    onClick={async () => {

                      await unpinAI(
                        selectedKnowledge
                      );

                      setSelectedKnowledge(
                        (current) =>
                          current
                            ? {
                                ...current,
                                pinned:
                                  false,
                                pinnedBy:
                                  "",
                                pinnedAt:
                                  null,
                              }
                            : null
                      );
                    }}
                  >
                    {aiPinningId ===
                    selectedKnowledge.id
                      ? "Saving..."
                      : "Unpin"}
                  </button>

                ) : (

                  <button
                    type="button"
                    className="knowledge-pin-button"
                    onClick={() =>
                      openAIPinModal(
                        selectedKnowledge
                      )
                    }
                  >
                    Pin
                  </button>

                )

              ) : (

                <>
                  <button
                    type="button"
                    className={
                      selectedKnowledge.pinned
                        ? "knowledge-unpin-button"
                        : "knowledge-pin-button"
                    }
                    disabled={
                      pinningId ===
                      selectedKnowledge.id
                    }
                    onClick={() => {
                      handleKnowledgePinClick(
                        selectedKnowledge
                      );
                    }}
                  >
                    {pinningId ===
                    selectedKnowledge.id
                      ? "Saving..."
                      : selectedKnowledge.pinned
                      ? "Unpin"
                      : "Pin"}
                  </button>

                  <button
                    type="button"
                    className="knowledge-delete-button"
                    disabled={
                      deletingId ===
                      selectedKnowledge.id
                    }
                    onClick={() =>
                      handleDeleteKnowledge(
                        selectedKnowledge
                      )
                    }
                  >
                    {deletingId ===
                    selectedKnowledge.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </>

              )}

            </div>

          </aside>
        </div>
      )}

      {/* =====================================================
          AI PIN MESSAGE MODAL
      ===================================================== */}

      {showAIPinModal &&
        selectedAIForPin && (
          <div
            className="pin-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !aiPinningId
              ) {
                closeAIPinModal();
              }
            }}
          >

            <div
              className="pin-modal"
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="pin-modal-header">

                <div>

                  <span className="pin-modal-label">
                    PIN MESSAGE
                  </span>

                  <h2>
                    Pin AI Research
                  </h2>

                  <p>
                    Enter the name of the
                    person who is pinning
                    this AI research.
                  </p>

                </div>

                <button
                  type="button"
                  className="pin-modal-close"
                  onClick={
                    closeAIPinModal
                  }
                  disabled={
                    !!aiPinningId
                  }
                >
                  ×
                </button>

              </div>

              <div
                className="knowledge-detail-question"
                style={{
                  marginBottom:
                    "20px",
                }}
              >
                <span>
                  Research
                </span>

                <p>
                  {
                    selectedAIForPin.question ||
                    selectedAIForPin.title
                  }
                </p>
              </div>

              <form
                onSubmit={
                  saveAIPin
                }
              >

                <div className="pin-modal-field">

                  <label htmlFor="ai-pinner-name">
                    Pinned by
                  </label>

                  <input
                    id="ai-pinner-name"
                    type="text"
                    value={
                      aiPinnerName
                    }
                    onChange={(event) =>
                      setAIPinnerName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your name"
                    autoComplete="off"
                    autoFocus
                    disabled={
                      !!aiPinningId
                    }
                  />

                </div>

                <div className="pin-modal-actions">

                  <button
                    type="button"
                    className="pin-modal-cancel"
                    onClick={
                      closeAIPinModal
                    }
                    disabled={
                      !!aiPinningId
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="pin-modal-save"
                    disabled={
                      !!aiPinningId ||
                      !aiPinnerName.trim()
                    }
                  >
                    {aiPinningId
                      ? "Pinning..."
                      : "Pin Message"}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete this knowledge?"
        message={`Are you sure you want to delete “${deleteTarget?.title || "this knowledge"}”? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteKnowledge}
        loading={Boolean(deletingId)}
      />
    </>
  );
}
