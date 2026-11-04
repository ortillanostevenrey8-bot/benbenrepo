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
  setDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import ReactMarkdown from "react-markdown";

import { auth, db, storage } from "../pages/firebase/firebase";
import ConfirmDialog from "./ConfirmDialog";
import { searchWalastikWebsite } from "../Services/walastikWebsiteSearch";
import "./KnowledgePanel.css";

const functions = getFunctions(auth.app);
const askWalastikAICall = httpsCallable(functions, "askWalastikAI");
const processWalastikDocumentCall = httpsCallable(
  functions,
  "processWalastikDocument",
  { timeout: 120000 }
);
const deleteWalastikDocumentCall = httpsCallable(functions, "deleteWalastikDocument");
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;
const DOCUMENT_CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".csv": "text/csv",
};

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
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [uploadingDocumentId, setUploadingDocumentId] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [processingDocumentId, setProcessingDocumentId] = useState(null);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "documents"),
      (snapshot) => {
        const documents = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((first, second) =>
            (second.uploadedAt?.seconds || 0) - (first.uploadedAt?.seconds || 0)
          );
        setUploadedDocuments(documents);
        setDocumentsLoading(false);
        setDocumentsError("");
      },
      (error) => {
        console.error("Document list listener error:", error);
        setDocumentsError("Unable to load uploaded documents.");
        setDocumentsLoading(false);
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

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAdmin) {
      setDocumentMessage("Only administrators can upload documents.");
      return;
    }

    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !DOCUMENT_CONTENT_TYPES[extension]) {
      setDocumentMessage("Choose a PDF, TXT, Markdown, or CSV file.");
      return;
    }
    if (file.name.length > 255) {
      setDocumentMessage("The filename must be 255 characters or fewer.");
      return;
    }
    if (!file.size || file.size > MAX_DOCUMENT_SIZE) {
      setDocumentMessage("Choose a file that is 100 MB or smaller.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setDocumentMessage("Sign in as an administrator before uploading.");
      return;
    }

    const documentRef = doc(collection(db, "documents"));
    const documentId = documentRef.id;
    const safeFilename = file.name
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .replace(/^\.+/, "document");
    const path = `walastik-documents/${user.uid}/${documentId}/${safeFilename}`;
    let metadataCreated = false;
    let uploadCompleted = false;

    setDocumentMessage("");
    setUploadingDocumentId(documentId);
    setUploadPercent(0);

    try {
      await setDoc(documentRef, {
        filename: file.name,
        storagePath: path,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
        sizeBytes: file.size,
        contentType: DOCUMENT_CONTENT_TYPES[extension],
        status: "uploading",
        chunkCount: 0,
      });
      metadataCreated = true;

      const task = uploadBytesResumable(
        storageRef(storage, path),
        file,
        { contentType: DOCUMENT_CONTENT_TYPES[extension] }
      );
      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            setUploadPercent(Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            ));
          },
          reject,
          resolve
        );
      });
      uploadCompleted = true;

      await processWalastikDocumentCall({ documentId });
      setDocumentMessage(`${file.name} was uploaded and indexed successfully.`);
    } catch (error) {
      console.error("Document upload or indexing error:", error);
      if (metadataCreated && !uploadCompleted) {
        try {
          await updateDoc(documentRef, {
            status: "failed",
            errorMessage: "File upload failed. Try uploading it again.",
          });
        } catch (statusError) {
          console.error("Unable to record document upload failure:", statusError);
        }
      }
      setDocumentMessage(
        `Unable to upload or index ${file.name}. ${error.message || "Please try again."}`
      );
    } finally {
      setUploadingDocumentId(null);
      setUploadPercent(0);
    }
  };

  const retryDocumentIndexing = async (item) => {
    if (!isAdmin || !item?.id || processingDocumentId) return;

    setProcessingDocumentId(item.id);
    setDocumentMessage("");
    try {
      await processWalastikDocumentCall({ documentId: item.id });
      setDocumentMessage(`${item.filename} was indexed successfully.`);
    } catch (error) {
      console.error("Document re-indexing error:", error);
      setDocumentMessage(
        `Unable to index ${item.filename}. ${error.message || "Please try again."}`
      );
    } finally {
      setProcessingDocumentId(null);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete?.id || deletingDocumentId) return;

    setDeletingDocumentId(documentToDelete.id);
    try {
      await deleteWalastikDocumentCall({ documentId: documentToDelete.id });
      setDocumentMessage(`${documentToDelete.filename} was deleted.`);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Document deletion error:", error);
      setDocumentMessage(
        `Unable to delete ${documentToDelete.filename}. ${error.message || "Please try again."}`
      );
    } finally {
      setDeletingDocumentId(null);
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
     DOCUMENT RAG AND OFFICIAL WEBSITE SEARCH
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
      if (websiteMatches.length) {
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
      }

      const { data } = await askWalastikAICall({ question });
      setPrivateWebsiteResults((results) => [
        {
          id: `google-search-${Date.now()}`,
          title: question,
          answer: data.answer,
          details: data.answer,
          question,
          source: "ai",
          sourceType: data.webSources?.length ? "web-search" : "ai-research",
          sources: data.sources || [],
          webSources: data.webSources || [],
          pinned: false,
          pinnedBy: "",
          pinnedAt: null,
          createdAt: new Date(),
          privateResult: true,
        },
        ...results,
      ]);
      setAiQuestion("");
    } catch (error) {
      console.error("WALASTIK AI search error:", error);
      const aiErrorMessage = ["functions/internal", "functions/not-found"].includes(error?.code)
        ? "Firebase could not reach the askWalastikAI function. Deploy that function and configure its GEMINI_API_KEY secret."
        : error.message || "Please try again.";
      setAiError(
        `WALASTIK AI could not answer right now. ${aiErrorMessage}`
      );
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
          sourceType: selectedAIForPin.sourceType || "ai",
          sourceUrls: selectedAIForPin.sourceUrls || [],
          sources: selectedAIForPin.sources || [],
          webSources: selectedAIForPin.webSources || [],
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
          doc(
            db,
            "knowledge",
            selectedAIForPin.id
          ),
          {
            pinned: true,
            pinnedBy: aiPinnerName.trim(),
            pinnedAt: serverTimestamp(),
            source: "ai",
            sourceType: selectedAIForPin.sourceType || "ai",
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
     PRIVATE SEARCH RESULTS AND SHARED PINNED AI
  ========================================================= */

  const websiteSearchResults =
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

          <section className="knowledge-section document-management-section">
            <div className="knowledge-section-header">
              <div>
                <span className="knowledge-section-label">
                  DOCUMENT KNOWLEDGE BASE
                </span>
                <h2>Uploaded documents</h2>
                <p>
                  WALASTIK AI searches indexed document content and cites the matching file and section.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="document-upload-controls">
                <label className="document-upload-control">
                  <span>{uploadingDocumentId ? "Uploading..." : "Choose PDF, TXT, Markdown, or CSV"}</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,.csv"
                    onChange={handleDocumentUpload}
                    disabled={Boolean(uploadingDocumentId)}
                  />
                </label>
                <span className="document-upload-hint">Maximum file size: 100 MB</span>
              </div>
            )}

            {uploadingDocumentId && (
              <div className="document-upload-progress" role="status" aria-live="polite">
                <span>
                  Uploading document: {uploadPercent}%
                </span>
                <progress value={uploadPercent} max="100">
                  {uploadPercent}%
                </progress>
                <span>Indexing document content...</span>
              </div>
            )}

            {documentMessage && (
              <p className="document-message" role="status" aria-live="polite">
                {documentMessage}
              </p>
            )}
            {documentsError && (
              <p className="document-message document-message-error" role="alert">
                {documentsError}
              </p>
            )}

            <div className="document-management-list">
              {documentsLoading ? (
                <p className="document-list-notice">Loading uploaded documents...</p>
              ) : uploadedDocuments.length === 0 ? (
                <p className="document-list-notice">No documents have been uploaded.</p>
              ) : (
                uploadedDocuments.map((item) => (
                  <article className="document-management-item" key={item.id}>
                    <div className="document-management-details">
                      <strong>{item.filename || "Untitled document"}</strong>
                      <span>
                        Uploaded {formatDate(item.uploadedAt) || "date unavailable"}
                        {item.sizeBytes
                          ? ` · ${(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                          : ""}
                      </span>
                    </div>
                    <span className={`document-status document-status-${item.status || "failed"}`}>
                      {item.status === "ready"
                        ? `Indexed · ${item.chunkCount || 0} chunks`
                        : item.status === "processing"
                          ? "Processing"
                          : item.status === "deleting"
                            ? "Deleting"
                            : item.status === "uploading"
                              ? "Uploading"
                              : "Indexing failed"}
                    </span>
                    {item.status === "failed" && item.errorMessage && (
                      <p className="document-item-error">{item.errorMessage}</p>
                    )}
                    {isAdmin && (
                      <div className="document-management-actions">
                        {item.status === "failed" && (
                          <button
                            type="button"
                            className="knowledge-pin-button"
                            onClick={() => retryDocumentIndexing(item)}
                            disabled={processingDocumentId === item.id || Boolean(uploadingDocumentId)}
                          >
                            {processingDocumentId === item.id ? "Retrying..." : "Retry indexing"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="knowledge-delete-button"
                          onClick={() => setDocumentToDelete(item)}
                          disabled={
                            deletingDocumentId === item.id
                            || processingDocumentId === item.id
                            || Boolean(uploadingDocumentId)
                          }
                        >
                          {deletingDocumentId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <div className="knowledge-divider" />

          {/* =================================================
              OFFICIAL WEBSITE SEARCH
          ================================================= */}

          <section className="knowledge-section">

            <div className="knowledge-section-header">
              <div>
                <span className="knowledge-section-label">
                  WALASTIK AI AND OFFICIAL WEBSITE
                </span>

                <h2>
                  Ask WALASTIK AI
                </h2>

                <p>
                  Search the web, uploaded documents, and official Walastik pages. Sources are shown with answers when available.
                </p>
              </div>
            </div>

            {/* AI QUESTION */}

            <div className="knowledge-search">
              <div className="knowledge-search-input">
                <input
                  type="text"
                  placeholder="Ask about Walastik or uploaded documents..."
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
                  : "Ask WALASTIK AI"}
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
                    Searching uploaded documents...
                  </strong>

                  <p>
                    Retrieving relevant sections and generating a sourced answer.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                WEBSITE RESULTS
            ================================================= */}

            {!aiLoading &&
              websiteSearchResults.length > 0 && (
                <div className="knowledge-list">
                  {websiteSearchResults.map(
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
                                  : item.sourceType === "document-rag"
                                    ? "DOCUMENT RAG"
                                    : item.sourceType === "web-search"
                                      ? "WEB SEARCH"
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
                          <ReactMarkdown>
                            {item.details || "No answer available."}
                          </ReactMarkdown>
                        </div>

                        {item.sources?.length > 0 && (
                          <div className="ai-source-links" onClick={(event) => event.stopPropagation()}>
                            <span>Uploaded document sources:</span>
                            {item.sources.map((source, index) => (
                              <span className="document-source-reference" key={`${source.filename}-${source.section}-${index}`}>
                                {source.filename}{source.section && source.section !== "Document"
                                  ? ` · ${source.section}`
                                  : ""}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.webSources?.length > 0 && (
                          <div className="ai-source-links" onClick={(event) => event.stopPropagation()}>
                            <span>Web sources:</span>
                            {item.webSources.map((source) => (
                              <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                            ))}
                          </div>
                        )}

                        {item.sourceType !== "document-rag" && (
                          <div className="ai-source-links" onClick={(event) => event.stopPropagation()}>
                            <span>Official Walastik sources:</span>
                            {(item.sourceUrls || WALASTIK_SOURCE_URLS).map((url) => {
                              const sourceName = url.includes("/about") ? "About" : url.includes("/branches") ? "Branches" : url.includes("/troubleshoot") ? "Troubleshooting" : "Walastik Internet";
                              return <a href={url} key={url} target="_blank" rel="noreferrer">{sourceName}</a>;
                            })}
                          </div>
                        )}

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

                        {isAdmin && (
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

                          {item.privateResult ? (
                            <button
                              type="button"
                              className="knowledge-delete-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPrivateWebsiteResults((results) =>
                                  results.filter((result) => result.id !== item.id)
                                );
                              }}
                            >
                              Dismiss
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="knowledge-delete-button"
                              disabled={deletingId === item.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteKnowledge(item);
                              }}
                            >
                              {deletingId === item.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                          </div>
                        )}

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

                      {isAdmin && (
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
                      )}

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
                {selectedKnowledge.source === "ai" ? (
                  <ReactMarkdown>
                    {selectedKnowledge.details || "No details available."}
                  </ReactMarkdown>
                ) : (
                  selectedKnowledge.details || "No details available."
                )}
              </div>

              {selectedKnowledge.sources?.length > 0 && (
                <div className="ai-source-links ai-detail-source-links">
                  <span>Uploaded document sources:</span>
                  {selectedKnowledge.sources.map((source, index) => (
                    <span className="document-source-reference" key={`${source.filename}-${source.section}-${index}`}>
                      {source.filename}{source.section && source.section !== "Document"
                        ? ` · ${source.section}`
                        : ""}
                    </span>
                  ))}
                </div>
              )}

              {selectedKnowledge.webSources?.length > 0 && (
                <div className="ai-source-links ai-detail-source-links">
                  <span>Web sources:</span>
                  {selectedKnowledge.webSources.map((source) => (
                    <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                  ))}
                </div>
              )}

              {selectedKnowledge.sourceType !== "document-rag"
                && (selectedKnowledge.source === "ai" || selectedKnowledge.sourceType === "website") && (
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
                    Researched / Created
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

            {isAdmin && (
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
            )}

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
      <ConfirmDialog
        show={Boolean(documentToDelete)}
        title="Delete this document?"
        message={`Are you sure you want to delete “${documentToDelete?.filename || "this document"}” and its search index? This cannot be undone.`}
        onCancel={() => setDocumentToDelete(null)}
        onConfirm={confirmDeleteDocument}
        loading={Boolean(deletingDocumentId)}
        label="CONFIRM DOCUMENT DELETE"
      />
    </>
  );
}
