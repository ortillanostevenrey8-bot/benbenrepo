import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./pages/firebase/firebase";

import Statistics from "./components/Statistics";
import KnowledgePanel from "./components/KnowledgePanel";
import PinModal from "./components/PinModal";
import ConfirmDialog from "./components/ConfirmDialog";
import AuthGate from "./components/AuthGate";
import LoadingScreen from "./components/LoadingScreen";

import "./App.css";

/* =========================================================
   DATE HELPERS
========================================================= */

const getDateValue = (value) => {
  if (!value) return 0;

  if (typeof value === "number") {
    return value;
  }

  if (value?.seconds) {
    return value.seconds * 1000;
  }

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (value) => {
  const timestamp = getDateValue(value);

  if (!timestamp) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const getAIAnswer = (item) => {
  const question = String(item?.question || item?.title || "").trim();
  const candidates = [
    item?.answer,
    item?.response,
    item?.aiResponse,
    item?.generatedAnswer,
    item?.content,
    item?.text,
    item?.body,
    item?.details,
  ];

  return (
    candidates.find((value) => {
      const text = typeof value === "string" ? value.trim() : "";
      return text && text !== question;
    }) || "No answer content was saved for this AI result."
  );
};

/* =========================================================
   APP
========================================================= */

function InformationCenter({ currentUser, account, onSignOut, onDeleteAccount, onDeleteUserAccount, onUpdateUsername, onUpdateName, onChangePassword, onCreateAccountForAdmin, onUploadProfilePicture }) {
  /* =======================================================
     ANNOUNCEMENTS
  ======================================================= */

  const [announcements, setAnnouncements] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [administratorAccounts, setAdministratorAccounts] = useState([]);
  const [showUsersWindow, setShowUsersWindow] = useState(false);
  const [selectedUserPicture, setSelectedUserPicture] = useState(null);
  const [grantAdminTarget, setGrantAdminTarget] = useState(null);
  const [removeAdminTarget, setRemoveAdminTarget] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [promotingUserId, setPromotingUserId] = useState(null);
  const [removingAdminId, setRemovingAdminId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAccountRole, setNewAccountRole] = useState("user");
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminError, setCreateAdminError] = useState("");
  const [announcementLoading, setAnnouncementLoading] =
    useState(true);

  const [announcementTitle, setAnnouncementTitle] =
    useState("");

  const [announcementContent, setAnnouncementContent] =
    useState("");

  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false);

  const [showAnnouncementWindow, setShowAnnouncementWindow] =
    useState(false);

  const [savingAnnouncement, setSavingAnnouncement] =
    useState(false);

  const [deletingAnnouncementId, setDeletingAnnouncementId] =
    useState(null);
  const [announcementDeleteTarget, setAnnouncementDeleteTarget] =
    useState(null);
  const [knowledgeDeleteTarget, setKnowledgeDeleteTarget] =
    useState(null);
  const [deletingKnowledgeId, setDeletingKnowledgeId] =
    useState(null);

  const [announcementSearch, setAnnouncementSearch] =
    useState("");

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState(null);

  /* =======================================================
     KNOWLEDGE
  ======================================================= */

  const [knowledge, setKnowledge] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] =
    useState(true);

  const [showKnowledge, setShowKnowledge] = useState(false);

  const [selectedKnowledge, setSelectedKnowledge] =
    useState(null);

  /* =======================================================
     PINNING
  ======================================================= */

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget] = useState(null);
  const [pinning, setPinning] = useState(false);

  const [showPinned, setShowPinned] = useState(false);

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  const [initialLoading, setInitialLoading] = useState(true);

  /* =======================================================
     TOAST
  ======================================================= */

  const [toast, setToast] = useState(null);

  /* =======================================================
     THEME
  ======================================================= */

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("walastik-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [usernameChange, setUsernameChange] = useState(account?.username || "");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameChangeError, setUsernameChangeError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  const [nameChange, setNameChange] = useState(account?.name || "");
  const [nameChangeError, setNameChangeError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [profilePictureStage, setProfilePictureStage] = useState("");
  const [profilePictureError, setProfilePictureError] = useState("");
  const [localProfilePicture, setLocalProfilePicture] = useState("");
  const [showProfilePicturePreview, setShowProfilePicturePreview] = useState(false);
  const profilePictureInput = useRef(null);

  useEffect(() => {
    setNameChange(account?.name || "");
  }, [account?.name]);

  useEffect(() => {
    if (!localProfilePicture) return undefined;
    return () => URL.revokeObjectURL(localProfilePicture);
  }, [localProfilePicture]);

  const uploadProfilePicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePictureError("");
    setProfilePictureStage("Preparing picture...");
    setLocalProfilePicture(URL.createObjectURL(file));
    setUploadingProfilePicture(true);
    try {
      await onUploadProfilePicture(file, setProfilePictureStage);
      setLocalProfilePicture("");
    } catch (uploadError) {
      setProfilePictureError(uploadError?.message || "Unable to upload your profile picture.");
    } finally {
      setUploadingProfilePicture(false);
      setProfilePictureStage("");
      event.target.value = "";
    }
  };

  const confirmDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteAccountError("");
    setDeletingAccount(true);
    try {
      await onDeleteAccount(deleteAccountPassword);
    } catch (deleteError) {
      setDeleteAccountError(deleteError?.code === "auth/wrong-password" || deleteError?.code === "auth/invalid-credential"
        ? "The password is incorrect. Please try again."
        : deleteError?.message || "Unable to delete this account. Please try again.");
      setDeletingAccount(false);
    }
  };

  const submitUsernameChange = async (event) => {
    event.preventDefault();
    setUsernameChangeError("");
    setSavingUsername(true);
    try {
      const updatedProfile = await onUpdateUsername(usernameChange, usernamePassword);
      setUsernameChange(updatedProfile?.username || usernameChange.trim().toLowerCase());
      setUsernamePassword("");
      showToast("Username updated.");
    } catch (usernameError) {
      setUsernameChangeError(usernameError?.code === "auth/email-already-in-use"
        ? "That username is already taken."
        : usernameError?.code === "auth/wrong-password" || usernameError?.code === "auth/invalid-credential"
          ? "The current password is incorrect."
          : usernameError?.message || "Unable to update the username.");
    } finally {
      setSavingUsername(false);
    }
  };

  const submitNameChange = async (event) => {
    event.preventDefault();
    setNameChangeError("");
    setSavingName(true);
    try {
      const updatedProfile = await onUpdateName(nameChange);
      setNameChange(updatedProfile?.name || nameChange.trim());
      showToast("Name updated.");
    } catch (nameError) {
      setNameChangeError(nameError?.message || "Unable to update your name.");
    } finally {
      setSavingName(false);
    }
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordChangeError("");
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showToast("Password updated.");
    } catch (passwordError) {
      setPasswordChangeError(passwordError?.code === "auth/wrong-password" || passwordError?.code === "auth/invalid-credential"
        ? "The current password is incorrect."
        : passwordError?.message || "Unable to update the password.");
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("walastik-theme", theme);
    } catch {
      // Ignore localStorage errors.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const promoteUserToAdmin = async (listedUser) => {
    setGrantAdminTarget(listedUser);
  };

  const confirmPromoteUserToAdmin = async () => {
    if (!grantAdminTarget) return;
    const listedUser = grantAdminTarget;
    const displayName = listedUser.name || listedUser.username || "this user";
    setPromotingUserId(listedUser.id);
    try {
      await updateDoc(doc(db, "users", listedUser.id), { role: "admin" });
      showToast(`${displayName} is now an administrator.`);
      setGrantAdminTarget(null);
    } catch (promotionError) {
      console.error("Unable to grant administrator access:", promotionError);
      showToast(`Unable to grant administrator access: ${promotionError?.message || "Firestore error"}`, "error");
    } finally {
      setPromotingUserId(null);
    }
  };

  const removeAdministrator = async (listedAdmin) => {
    const isCurrentAdmin =
      String(listedAdmin.uid || listedAdmin.id) === String(currentUser?.uid)
      || String(listedAdmin.id) === String(currentUser?.uid);

    if (isCurrentAdmin || totalAdmins <= 1) return;
    setRemoveAdminTarget(listedAdmin);
  };

  const confirmRemoveAdministrator = async () => {
    if (!removeAdminTarget) return;
    const listedAdmin = removeAdminTarget;
    const displayName = listedAdmin.name || listedAdmin.username || "this administrator";
    setRemovingAdminId(listedAdmin.id);
    try {
      await updateDoc(doc(db, "users", listedAdmin.id), { role: "user" });
      showToast(`${displayName} is now a regular user.`);
      setRemoveAdminTarget(null);
    } catch (removalError) {
      console.error("Unable to remove administrator access:", removalError);
      showToast(`Unable to remove administrator access: ${removalError?.message || "Firestore error"}`, "error");
    } finally {
      setRemovingAdminId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    const listedUser = deleteUserTarget;
    const targetUid = listedUser.uid || listedUser.id;
    setDeletingUserId(listedUser.id);
    try {
      await onDeleteUserAccount(targetUid);
      showToast(`${listedUser.name || listedUser.username || "User"}'s account was permanently deleted.`);
      setDeleteUserTarget(null);
    } catch (deletionError) {
      console.error("Unable to delete user account:", deletionError);
      const errorMessage = deletionError?.code === "functions/not-found"
        ? "The delete-account service is not deployed. From the project folder run: firebase deploy --only functions:deleteUserAccount"
        : deletionError?.code === "functions/internal"
          ? "Firebase could not complete the request. No delete-account function is currently deployed; deploy it with: firebase deploy --only functions:deleteUserAccount"
        : deletionError?.code === "functions/unavailable"
          ? "The delete-account service is unavailable. Check that the Cloud Function is deployed and try again."
          : deletionError?.message || "Account deletion failed";
      showToast(`Unable to delete user account: ${errorMessage}`, "error");
    } finally {
      setDeletingUserId(null);
    }
  };

  const submitCreateAdmin = async (event) => {
    event.preventDefault();
    setCreateAdminError("");
    setCreatingAdmin(true);
    try {
      await onCreateAccountForAdmin(newAdminName, newAdminUsername, newAdminPassword, newAccountRole);
      setNewAdminName("");
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAccountRole("user");
      setShowNewAdminPassword(false);
      setShowCreateAdminForm(false);
      showToast(`${newAccountRole === "admin" ? "Administrator" : "User"} account @${newAdminUsername.trim().toLowerCase()} created.`);
    } catch (createError) {
      setCreateAdminError(createError?.code === "auth/email-already-in-use"
        ? "That username is already taken."
        : createError?.message || "Unable to create the account.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  /* =======================================================
     LOAD ANNOUNCEMENTS
  ======================================================= */

  useEffect(() => {
    const announcementsRef = collection(
      db,
      "announcements"
    );

    const unsubscribe = onSnapshot(
      announcementsRef,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          const dateA = getDateValue(
            a.createdAt || a.createdDate
          );

          const dateB = getDateValue(
            b.createdAt || b.createdDate
          );

          return dateB - dateA;
        });

        setAnnouncements(data);
        setAnnouncementLoading(false);
      },
      (error) => {
        console.error(
          "FIRESTORE ANNOUNCEMENTS ERROR:",
          error
        );

        setAnnouncements([]);
        setAnnouncementLoading(false);

        showToast(
          `Unable to load announcements: ${
            error?.message || "Firestore error"
          }`,
          "error"
        );
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (account?.role !== "admin") return undefined;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const allAccounts = snapshot.docs.map((userDoc) => ({
          ...userDoc.data(),
          id: userDoc.id,
        }));
        const isAdministrator = (user) =>
          typeof user.role === "string" && user.role.trim().toLowerCase() === "admin";
        const administratorIds = new Set();
        const administratorById = new Map();

        allAccounts.filter(isAdministrator).forEach((user) => {
          const accountId = user.uid || user.id;
          administratorIds.add(String(user.id));
          administratorIds.add(String(accountId));
          if (!administratorById.has(String(accountId))) {
            administratorById.set(String(accountId), user);
          }
        });

        const administrators = Array.from(administratorById.values());
        const usersOnly = allAccounts.filter((user) =>
          !isAdministrator(user)
          && !administratorIds.has(String(user.id))
          && !administratorIds.has(String(user.uid || user.id))
        );

        administrators.sort((a, b) => (a.name || a.username || "").localeCompare(b.name || b.username || ""));
        usersOnly.sort((a, b) => getDateValue(b.lastSignInAt) - getDateValue(a.lastSignInAt));
        setAdministratorAccounts(administrators);
        setTotalAdmins(administrators.length);
        setAdminUsers(usersOnly);
        setTotalUsers(usersOnly.length);
      },
      (error) => {
        console.error("FIRESTORE USERS ERROR:", error);
      }
    );

    return unsubscribe;
  }, [account?.role]);

  /* =======================================================
     LOAD KNOWLEDGE
  ======================================================= */

  useEffect(() => {
    const knowledgeRef = collection(db, "knowledge");

    const unsubscribe = onSnapshot(
      knowledgeRef,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          if (
            Boolean(a.pinned) !== Boolean(b.pinned)
          ) {
            return a.pinned ? -1 : 1;
          }

          return (
            getDateValue(b.createdAt) -
            getDateValue(a.createdAt)
          );
        });

        setKnowledge(data);
        setKnowledgeLoading(false);
      },
      (error) => {
        console.error(
          "FIRESTORE KNOWLEDGE ERROR:",
          error
        );

        setKnowledge([]);
        setKnowledgeLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /* =======================================================
     INITIAL LOADING FINISH
  ======================================================= */

  useEffect(() => {
    if (
      announcementLoading ||
      knowledgeLoading
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setInitialLoading(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    announcementLoading,
    knowledgeLoading,
  ]);

  /* =======================================================
     OPEN ANNOUNCEMENT
  ======================================================= */

  const handleOpenAnnouncement = (announcement) => {
    if (!announcement?.id) {
      return;
    }

    setSelectedAnnouncement(announcement);
  };

  /* =======================================================
     CLOSE ANNOUNCEMENT
  ======================================================= */

  const handleCloseAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  /* =======================================================
     ADD ANNOUNCEMENT
  ======================================================= */

  const handleAddAnnouncement = async (event) => {
    event.preventDefault();

    if (savingAnnouncement) {
      return;
    }

    const title = announcementTitle.trim();
    const content = announcementContent.trim();

    if (!title) {
      showToast(
        "Please enter an announcement title.",
        "error"
      );
      return;
    }

    if (!content) {
      showToast(
        "Please enter the announcement message.",
        "error"
      );
      return;
    }

    setSavingAnnouncement(true);

    try {
      await addDoc(
        collection(db, "announcements"),
        {
          title,
          content,
          createdAt: serverTimestamp(),
          createdDate: new Date().toISOString(),

          pinned: false,
          pinnedBy: "",
          pinnedAt: null,
          pinnedDate: null,
        }
      );

      setAnnouncementTitle("");
      setAnnouncementContent("");
      setShowAnnouncementForm(false);

      showToast(
        "Announcement posted successfully."
      );
    } catch (error) {
      console.error(
        "ADD ANNOUNCEMENT ERROR:",
        error
      );

      showToast(
        error?.message
          ? `Unable to post announcement: ${error.message}`
          : "Unable to post announcement.",
        "error"
      );
    } finally {
      setSavingAnnouncement(false);
    }
  };

  /* =======================================================
     DELETE ANNOUNCEMENT
  ======================================================= */

  const handleDeleteAnnouncement = (id) => {
    if (!id || deletingAnnouncementId) {
      return;
    }

    setAnnouncementDeleteTarget(
      announcements.find((item) => item.id === id) || { id }
    );
  };

  const confirmDeleteAnnouncement = async () => {
    const id = announcementDeleteTarget?.id;
    if (!id || deletingAnnouncementId) return;

    setDeletingAnnouncementId(id);

    try {
      await deleteDoc(
        doc(db, "announcements", id)
      );

      if (
        selectedAnnouncement?.id === id
      ) {
        setSelectedAnnouncement(null);
      }

      showToast(
        "Announcement deleted."
      );
    } catch (error) {
      console.error(
        "DELETE ANNOUNCEMENT ERROR:",
        error
      );

      showToast(
        error?.message
          ? `Unable to delete announcement: ${error.message}`
          : "Unable to delete announcement.",
        "error"
      );
    } finally {
      setDeletingAnnouncementId(null);
      setAnnouncementDeleteTarget(null);
    }
  };

  const handleDeleteKnowledgeFromDashboard = (item) => {
    if (!item?.id || deletingKnowledgeId) return;
    setKnowledgeDeleteTarget(item);
  };

  const confirmDeleteKnowledgeFromDashboard = async () => {
    const item = knowledgeDeleteTarget;
    if (!item?.id || deletingKnowledgeId) return;

    setDeletingKnowledgeId(item.id);

    try {
      await deleteDoc(doc(db, "knowledge", item.id));

      if (selectedKnowledge?.id === item.id) {
        setSelectedKnowledge(null);
      }

      showToast("Knowledge deleted.");
    } catch (error) {
      console.error("DELETE AI KNOWLEDGE ERROR:", error);
      showToast(
        error?.message
          ? `Unable to delete knowledge: ${error.message}`
          : "Unable to delete knowledge.",
        "error"
      );
    } finally {
      setDeletingKnowledgeId(null);
      setKnowledgeDeleteTarget(null);
    }
  };

  /* =======================================================
     PIN CLICK
  ======================================================= */

  const handlePinClick = (item) => {
    if (!item?.id) {
      return;
    }

    setPinTarget(item);
    setShowPinModal(true);
  };

  /* =======================================================
     CLOSE PIN MODAL
  ======================================================= */

  const closePinModal = () => {
    if (pinning) {
      return;
    }

    setShowPinModal(false);
    setPinTarget(null);
  };

  /* =======================================================
     PIN MESSAGE
  ======================================================= */

  const handlePinMessage = async (pinnerName) => {
    if (!pinTarget?.id || pinning) {
      return;
    }

    const name = String(
      pinnerName || ""
    ).trim();

    if (!name) {
      return;
    }

    setPinning(true);

    try {
      const collectionName =
        pinTarget.type === "knowledge" ||
        pinTarget.source === "ai"
          ? "knowledge"
          : "announcements";

      await updateDoc(
        doc(
          db,
          collectionName,
          pinTarget.id
        ),
        {
          pinned: true,
          pinnedBy: name,
          pinnedAt: serverTimestamp(),
          pinnedDate: new Date().toISOString(),
        }
      );

      setShowPinModal(false);
      setPinTarget(null);

      showToast(
        "Message pinned successfully."
      );
    } catch (error) {
      console.error(
        "PIN MESSAGE ERROR:",
        error
      );

      showToast(
        error?.message
          ? `Unable to pin this message: ${error.message}`
          : "Unable to pin this message.",
        "error"
      );
    } finally {
      setPinning(false);
    }
  };

  /* =======================================================
     UNPIN MESSAGE
  ======================================================= */

  const handleUnpin = async (item) => {
    if (!item?.id) {
      return;
    }

    const collectionName =
      item.type === "knowledge" ||
      item.source === "ai"
        ? "knowledge"
        : "announcements";

    try {
      await updateDoc(
        doc(
          db,
          collectionName,
          item.id
        ),
        {
          pinned: false,
          pinnedBy: "",
          pinnedAt: null,
          pinnedDate: null,
        }
      );

      showToast(
        "Message unpinned."
      );
    } catch (error) {
      console.error(
        "UNPIN ERROR:",
        error
      );

      showToast(
        error?.message
          ? `Unable to unpin message: ${error.message}`
          : "Unable to unpin message.",
        "error"
      );
    }
  };

  /* =======================================================
     TYPE DATA
  ======================================================= */

  const typedAnnouncements = useMemo(
    () =>
      announcements.map((item) => ({
        ...item,
        type: "announcement",
      })),
    [announcements]
  );

  const typedKnowledge = useMemo(
    () =>
      knowledge.map((item) => ({
        ...item,
        type: "knowledge",
      })),
    [knowledge]
  );

  /* =======================================================
     PINNED DATA
  ======================================================= */

  const pinnedAnnouncements =
    typedAnnouncements.filter(
      (item) => item.pinned
    );

  const pinnedKnowledge =
    typedKnowledge.filter(
      (item) => item.pinned
    );

  const totalPinned =
    pinnedAnnouncements.length +
    pinnedKnowledge.length;

  /* =======================================================
     ANNOUNCEMENT SEARCH
  ======================================================= */

  const filteredAnnouncements = useMemo(() => {
    const search =
      announcementSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return typedAnnouncements;
    }

    return typedAnnouncements.filter(
      (item) => {
        const title =
          String(
            item.title || ""
          ).toLowerCase();

        const content =
          String(
            item.content || ""
          ).toLowerCase();

        return (
          title.includes(search) ||
          content.includes(search)
        );
      }
    );
  }, [
    announcementSearch,
    typedAnnouncements,
  ]);

  /* =======================================================
     STATISTICS ACTIONS
  ======================================================= */

  const handleOpenAnnouncements = () => {
    setShowAnnouncementWindow(true);
  };

  const handleOpenKnowledge = () => {
    setShowKnowledge(true);
  };

  const handleOpenKnowledgeDetail = (item) => {
    if (!item?.id) {
      return;
    }

    setSelectedKnowledge(item);
  };

  const handleCloseKnowledgeDetail = () => {
    setSelectedKnowledge(null);
  };

  const handleOpenPinned = () => {
    setShowPinned(true);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className={`app theme-${theme}`} style={{ "--app-background-image": "url('/tokyo-ui-background.avif')" }}>

      {/* =================================================
          INITIAL LOADING
      ================================================= */}

      {initialLoading && <LoadingScreen />}

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="app-content">

        <header className="dashboard-topbar">
          <div className="dashboard-brand" aria-label="Walastik Enterprise">
            <span className="dashboard-brand-mark">W</span>
            <span>WALASTIK <b>ENTERPRISE</b></span>
          </div>
          <div className="dashboard-topbar-actions">
            <div className="account-menu-wrap">
              <button type="button" className="account-menu-trigger" onClick={() => setShowAccountMenu((open) => !open)} aria-expanded={showAccountMenu}>
                <span className="account-avatar" aria-hidden="true">{(account?.photoDataUrl || account?.photoURL) ? <img src={account.photoDataUrl || account.photoURL} alt="" /> : (account?.name || currentUser?.email || "U").slice(0, 1).toUpperCase()}</span>
                <span>{account?.name || account?.username || "User"}</span>
                <span className="account-chevron" aria-hidden="true">⌄</span>
              </button>
              {showAccountMenu && (
                <div className="account-menu">
                  <span className="account-menu-username">{account?.username || currentUser?.email}</span>
                  <span className="account-menu-role">{account?.role === "admin" ? "Administrator" : "User account"}</span>
                  <button type="button" onClick={onSignOut}>Sign out</button>
                  <button type="button" onClick={() => { setShowAccountMenu(false); setDeleteAccountError(""); setDeleteAccountPassword(""); setShowDeleteConfirm(false); setShowSettings(true); }}>Settings</button>
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <button type="button" className="theme-toggle-button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>

        {/* PAGE HEADING */}

        <section className="page-heading">

          <div>

            <span className="page-heading-label">
              WALASTIK ENTERPRISE
            </span>

            <h1>
              Information Center
            </h1>

            <p>
              Company announcements and
              knowledge information in one place.
            </p>

          </div>

        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <Statistics
          isAdmin={account?.role === "admin"}
          totalUsers={totalUsers}
          totalAdmins={totalAdmins}
          totalUpdates={
            announcements.length
          }
          knowledgeArticles={
            knowledge.length
          }
          pinnedMessages={
            totalPinned
          }
          onOpenAnnouncements={
            handleOpenAnnouncements
          }
          onOpenKnowledge={
            handleOpenKnowledge
          }
          onOpenPinned={
            handleOpenPinned
          }
          onOpenUsers={() => setShowUsersWindow(true)}
        />

        {/* =================================================
            INFORMATION GRID
        ================================================= */}

        <div className="information-grid">

          {/* =================================================
              ANNOUNCEMENTS
          ================================================= */}

          <section
            className="content-panel announcement-panel"
          >

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  COMPANY UPDATES
                </span>

                <h2>
                  Announcements
                </h2>

              </div>

              {account?.role === "admin" && (
                <button
                  type="button"
                  className={`primary-button announcement-toggle-button ${showAnnouncementForm ? "is-open" : ""}`}
                  onClick={() => setShowAnnouncementForm((value) => !value)}
                >
                  {showAnnouncementForm ? "Close" : "Add Announcement"}
                </button>
              )}

            </div>

            {/* ADD ANNOUNCEMENT FORM */}

            {account?.role === "admin" && showAnnouncementForm && (
              <form
                className="announcement-form"
                onSubmit={
                  handleAddAnnouncement
                }
              >

                <input
                  type="text"
                  value={
                    announcementTitle
                  }
                  onChange={(event) =>
                    setAnnouncementTitle(
                      event.target.value
                    )
                  }
                  placeholder="Announcement title"
                  disabled={
                    savingAnnouncement
                  }
                />

                <textarea
                  value={
                    announcementContent
                  }
                  onChange={(event) =>
                    setAnnouncementContent(
                      event.target.value
                    )
                  }
                  placeholder="Write your announcement..."
                  rows={5}
                  disabled={
                    savingAnnouncement
                  }
                />

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setAnnouncementTitle("");
                      setAnnouncementContent("");
                      setShowAnnouncementForm(false);
                    }}
                    disabled={
                      savingAnnouncement
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button announcement-submit-button"
                    disabled={
                      savingAnnouncement ||
                      !announcementTitle.trim() ||
                      !announcementContent.trim()
                    }
                  >
                    {savingAnnouncement
                      ? "Posting..."
                      : "Post Announcement"}
                  </button>

                </div>

              </form>
            )}

            {/* SEARCH */}

            <div className="panel-search">

              <input
                type="text"
                value={
                  announcementSearch
                }
                onChange={(event) =>
                  setAnnouncementSearch(
                    event.target.value
                  )
                }
                placeholder="Search announcements..."
              />

            </div>

            {/* ANNOUNCEMENT LIST */}

            <div className="announcement-list">

              {announcementLoading ? (

                <div className="empty-state">
                  Loading announcements...
                </div>

              ) : filteredAnnouncements.length === 0 ? (

                <div className="empty-state">
                  {announcementSearch
                    ? "No matching announcements found."
                    : "No announcements yet."}
                </div>

              ) : (

                filteredAnnouncements.map(
                  (announcement) => (

                    <article
                      key={
                        announcement.id
                      }
                      className={
                        `announcement-card announcement-card-clickable ${
                          announcement.pinned
                            ? "is-pinned"
                            : ""
                        }`
                      }
                      onClick={() =>
                        handleOpenAnnouncement(
                          announcement
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          handleOpenAnnouncement(
                            announcement
                          );
                        }
                      }}
                    >

                      <div className="announcement-card-top">

                        <div>

                          {announcement.pinned && (
                            <span className="pinned-badge">
                              PINNED
                            </span>
                          )}

                          <h3>
                            {announcement.title}
                          </h3>

                        </div>

                      </div>

                      <p className="announcement-content">
                        {announcement.content}
                      </p>

                      <div className="announcement-meta">

                        <span>
                          Posted{" "}
                          {formatDate(
                            announcement.createdAt ||
                            announcement.createdDate
                          )}
                        </span>

                        {announcement.pinned &&
                          announcement.pinnedBy && (
                            <span>
                              Pinned by{" "}
                              {
                                announcement.pinnedBy
                              }
                            </span>
                          )}

                      </div>

                      <div className="announcement-actions">

                        <button
                          type="button"
                          className={
                            announcement.pinned
                              ? "unpin-button"
                              : "pin-button"
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            if (
                              announcement.pinned
                            ) {
                              handleUnpin(
                                announcement
                              );
                            } else {
                              handlePinClick(
                                announcement
                              );
                            }
                          }}
                        >
                          {announcement.pinned
                            ? "Unpin"
                            : "Pin"}
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleDeleteAnnouncement(
                              announcement.id
                            );
                          }}
                          disabled={
                            deletingAnnouncementId ===
                            announcement.id
                          }
                        >
                          {deletingAnnouncementId ===
                          announcement.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                    </article>

                  )
                )

              )}

            </div>

          </section>

          {/* =================================================
              KNOWLEDGE
          ================================================= */}

          <section
            className="content-panel knowledge-dashboard"
          >

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  WALASTIK KNOWLEDGE
                </span>

                <h2>
                  Knowledge
                </h2>

                <p>
                  Company information and
                  WALASTIK AI knowledge.
                </p>

              </div>

              <button
                type="button"
                className="primary-button open-knowledge-button"
                onClick={
                  handleOpenKnowledge
                }
              >
                Open Knowledge
              </button>

            </div>

            <div className="knowledge-dashboard-list">

              {knowledgeLoading ? (

                <div className="empty-state">
                  Loading knowledge...
                </div>

              ) : knowledge.length === 0 ? (

                <div className="empty-state">
                  No knowledge articles yet.
                  <br />
                  Click "Open Knowledge" to
                  add or search knowledge.
                </div>

              ) : (

                knowledge.map((item) => (

                  <article
                    key={item.id}
                    className={
                      `knowledge-dashboard-card ${
                        item.pinned
                          ? "is-pinned"
                          : ""
                      }`
                    }
                    onClick={() =>
                      handleOpenKnowledgeDetail(
                        item
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        handleOpenKnowledgeDetail(
                          item
                        );
                      }
                    }}
                  >

                    <div className="knowledge-dashboard-card-top">

                      <div>

                        {item.pinned && (
                          <span className="pinned-badge">
                            PINNED
                          </span>
                        )}

                        <span className="knowledge-card-type">
                          {item.source === "ai"
                            ? "AI KNOWLEDGE"
                            : "COMPANY KNOWLEDGE"}
                        </span>

                        <h3>
                          {item.title ||
                            "AI Answer"}
                        </h3>

                      </div>

                    </div>

                    <p className="knowledge-dashboard-content">
                      {item.details ||
                        item.content ||
                        ""}
                    </p>

                    <div className="knowledge-dashboard-meta">

                      <span>
                        {item.source === "ai"
                          ? "AI Knowledge"
                          : `Posted ${formatDate(
                              item.createdAt ||
                              item.createdDate
                            )}`}
                      </span>

                      {item.pinned &&
                        item.pinnedBy && (
                          <span>
                            Pinned by{" "}
                            {item.pinnedBy}
                          </span>
                        )}

                    </div>

                    <div className="knowledge-dashboard-actions">

                      <button
                        type="button"
                        className={
                          item.pinned
                            ? "unpin-button"
                            : "pin-button"
                        }
                        onClick={(event) => {
                          event.stopPropagation();

                          if (
                            item.pinned
                          ) {
                            handleUnpin({
                              ...item,
                              type: "knowledge",
                            });
                          } else {
                            handlePinClick({
                              ...item,
                              type: "knowledge",
                            });
                          }
                        }}
                        disabled={
                          pinning &&
                          pinTarget?.id ===
                            item.id
                        }
                      >
                        {item.pinned
                          ? "Unpin"
                          : pinning &&
                            pinTarget?.id ===
                              item.id
                          ? "Pinning..."
                          : "Pin"}
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteKnowledgeFromDashboard(item);
                        }}
                        disabled={deletingKnowledgeId === item.id}
                      >
                        {deletingKnowledgeId === item.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </article>

                ))

              )}

            </div>

          </section>

        </div>

      </main>

      {showSettings && (
        <div className="statistics-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingAccount && !savingName && !savingUsername && !savingPassword) setShowSettings(false); }}>
          <section className="statistics-window delete-account-window settings-window" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="statistics-window-header">
              <div>
                <span className="panel-label">ACCOUNT SETTINGS</span>
                <h2 id="settings-title">Account settings</h2>
                <p>Manage your username, password, profile picture, and account.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowSettings(false)} disabled={deletingAccount || savingName || savingUsername || savingPassword} aria-label="Close settings">×</button>
            </div>
            <form className="settings-form account-credential-form" onSubmit={submitNameChange}>
              <h3>Change name</h3>
              <label htmlFor="settings-name">Name</label>
              <input id="settings-name" type="text" autoComplete="name" maxLength={80} value={nameChange} onChange={(event) => setNameChange(event.target.value)} required />
              {nameChangeError && <p className="auth-message auth-error" role="alert">{nameChangeError}</p>}
              <button type="submit" className="settings-save-button" disabled={savingName}>{savingName ? "Saving..." : "Save name"}</button>
            </form>
            <form className="settings-form account-credential-form" onSubmit={submitUsernameChange}>
              <h3>Change username</h3>
              <label htmlFor="settings-username">Username</label>
              <input id="settings-username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]{3,24}" value={usernameChange} onChange={(event) => setUsernameChange(event.target.value)} required />
              <label htmlFor="settings-username-password">Current password</label>
              <span className="settings-password-input">
                <input id="settings-username-password" type={showUsernamePassword ? "text" : "password"} autoComplete="current-password" value={usernamePassword} onChange={(event) => setUsernamePassword(event.target.value)} required />
                <button type="button" onClick={() => setShowUsernamePassword((visible) => !visible)} aria-pressed={showUsernamePassword}>{showUsernamePassword ? "Hide" : "View"}</button>
              </span>
              {usernameChangeError && <p className="auth-message auth-error" role="alert">{usernameChangeError}</p>}
              <button type="submit" className="settings-save-button" disabled={savingUsername}>{savingUsername ? "Saving..." : "Save username"}</button>
            </form>
            <form className="settings-form account-credential-form" onSubmit={submitPasswordChange}>
              <h3>Change password</h3>
              <label htmlFor="settings-current-password">Current password</label>
              <span className="settings-password-input">
                <input id="settings-current-password" type={showCurrentPassword ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowCurrentPassword((visible) => !visible)} aria-pressed={showCurrentPassword}>{showCurrentPassword ? "Hide" : "View"}</button>
              </span>
              <label htmlFor="settings-new-password">New password</label>
              <span className="settings-password-input">
                <input id="settings-new-password" type={showNewPassword ? "text" : "password"} autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowNewPassword((visible) => !visible)} aria-pressed={showNewPassword}>{showNewPassword ? "Hide" : "View"}</button>
              </span>
              <label htmlFor="settings-confirm-new-password">Confirm new password</label>
              <span className="settings-password-input">
                <input id="settings-confirm-new-password" type={showConfirmNewPassword ? "text" : "password"} autoComplete="new-password" minLength={6} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowConfirmNewPassword((visible) => !visible)} aria-pressed={showConfirmNewPassword}>{showConfirmNewPassword ? "Hide" : "View"}</button>
              </span>
              {passwordChangeError && <p className="auth-message auth-error" role="alert">{passwordChangeError}</p>}
              <button type="submit" className="settings-save-button" disabled={savingPassword}>{savingPassword ? "Saving..." : "Save password"}</button>
            </form>
            <div className="profile-picture-settings">
              <button type="button" className="account-avatar profile-picture-preview profile-picture-preview-button" onClick={() => setShowProfilePicturePreview(true)} aria-label="View profile picture">
                {(localProfilePicture || account?.photoDataUrl || account?.photoURL) ? <img src={localProfilePicture || account.photoDataUrl || account.photoURL} alt="" /> : (account?.name || currentUser?.email || "U").slice(0, 1).toUpperCase()}
              </button>
              <div className="profile-picture-controls">
                <strong>Profile picture</strong>
                <input ref={profilePictureInput} className="profile-picture-file-input" type="file" accept="image/*" onChange={uploadProfilePicture} disabled={uploadingProfilePicture} />
                <div className="profile-picture-actions">
                  <button type="button" className="profile-picture-view-button" onClick={() => setShowProfilePicturePreview(true)} disabled={!localProfilePicture && !account?.photoDataUrl && !account?.photoURL}>View</button>
                  <button type="button" className="profile-picture-edit-button" onClick={() => profilePictureInput.current?.click()} disabled={uploadingProfilePicture}>{uploadingProfilePicture ? "Uploading..." : "Choose file"}</button>
                </div>
                {uploadingProfilePicture && <span className="profile-picture-progress" role="status">{profilePictureStage}</span>}
                {profilePictureError && <p className="auth-message auth-error" role="alert">{profilePictureError}</p>}
              </div>
            </div>
            <div className="settings-danger-zone">
              <h3>Delete account</h3>
              <p>This permanently deletes your account and its user profile.</p>
              {!showDeleteConfirm ? (
                <button type="button" className="settings-delete-trigger" onClick={() => { setDeleteAccountError(""); setDeleteAccountPassword(""); setShowDeleteConfirm(true); }}>Delete account</button>
              ) : (
            <form className="delete-account-form" onSubmit={confirmDeleteAccount}>
              <label htmlFor="delete-account-password">Enter your password to confirm</label>
              <input id="delete-account-password" type="password" autoComplete="current-password" value={deleteAccountPassword} onChange={(event) => setDeleteAccountPassword(event.target.value)} required />
              {deleteAccountError && <p className="auth-message auth-error" role="alert">{deleteAccountError}</p>}
              <div className="delete-account-actions">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deletingAccount}>Cancel</button>
                <button type="submit" disabled={deletingAccount}>{deletingAccount ? "Deleting..." : "Confirm deletion"}</button>
              </div>
            </form>
              )}
            </div>
          </section>
        </div>
      )}

      {showProfilePicturePreview && (localProfilePicture || account?.photoDataUrl || account?.photoURL) && (
        <div className="statistics-overlay profile-picture-preview-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProfilePicturePreview(false); }}>
          <div className="profile-picture-preview-dialog" role="dialog" aria-modal="true" aria-label="Profile picture preview">
            <button type="button" className="modal-close" onClick={() => setShowProfilePicturePreview(false)} aria-label="Close picture preview">×</button>
            <img src={localProfilePicture || account.photoDataUrl || account.photoURL} alt="Profile preview" />
          </div>
        </div>
      )}

      {showUsersWindow && account?.role === "admin" && (
        <div
          className="statistics-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowUsersWindow(false);
          }}
        >
          <section className="statistics-window users-window" role="dialog" aria-modal="true" aria-labelledby="users-window-title">
            <div className="statistics-window-header">
              <div>
                <span className="panel-label">ACCOUNT ACTIVITY</span>
                <h2 id="users-window-title">User accounts</h2>
                <p>{totalUsers} user{totalUsers === 1 ? "" : "s"} · {totalAdmins} administrator{totalAdmins === 1 ? "" : "s"}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowUsersWindow(false)} aria-label="Close user list">×</button>
            </div>
            <div className="admin-create-toolbar">
              <button
                type="button"
                className="settings-save-button"
                onClick={() => {
                  setCreateAdminError("");
                  setNewAccountRole("user");
                  setShowCreateAdminForm((visible) => !visible);
                }}
                aria-expanded={showCreateAdminForm}
              >
                {showCreateAdminForm ? "Cancel" : "Create account"}
              </button>
              <button
                type="button"
                className="settings-save-button"
                onClick={() => {
                  setCreateAdminError("");
                  setNewAccountRole("admin");
                  setShowCreateAdminForm(true);
                }}
                aria-expanded={showCreateAdminForm && newAccountRole === "admin"}
              >
                Add admin
              </button>
            </div>
            {showCreateAdminForm && (
              <form className="admin-create-form account-credential-form" onSubmit={submitCreateAdmin}>
                <h3>{newAccountRole === "admin" ? "Add administrator" : "Create account"}</h3>
                <p>Choose whether the new account should be an administrator or a regular user.</p>
                <label htmlFor="new-account-role">Account type</label>
                <select id="new-account-role" value={newAccountRole} onChange={(event) => setNewAccountRole(event.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <label htmlFor="new-admin-name">Name</label>
                <input id="new-admin-name" type="text" autoComplete="name" maxLength={80} value={newAdminName} onChange={(event) => setNewAdminName(event.target.value)} required />
                <label htmlFor="new-admin-username">Username</label>
                <input id="new-admin-username" type="text" autoComplete="off" autoCapitalize="none" spellCheck="false" minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]{3,24}" value={newAdminUsername} onChange={(event) => setNewAdminUsername(event.target.value)} required />
                <label htmlFor="new-admin-password">Password (at least 6 characters)</label>
                <span className="settings-password-input">
                  <input id="new-admin-password" type={showNewAdminPassword ? "text" : "password"} autoComplete="new-password" minLength={6} value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} required />
                  <button type="button" onClick={() => setShowNewAdminPassword((visible) => !visible)} aria-pressed={showNewAdminPassword}>{showNewAdminPassword ? "Hide" : "View"}</button>
                </span>
                {createAdminError && <p className="auth-message auth-error" role="alert">{createAdminError}</p>}
                <button type="submit" className="settings-save-button" disabled={creatingAdmin}>{creatingAdmin ? "Creating..." : `Create ${newAccountRole === "admin" ? "admin" : "user"}`}</button>
              </form>
            )}
            <section className="users-account-section administrators-section" aria-labelledby="administrators-list-title">
              <div className="users-account-section-header">
                <h3 id="administrators-list-title">Administrators</h3>
                <span>{totalAdmins}</span>
              </div>
              <div className="users-signin-list">
                {administratorAccounts.length === 0 ? (
                  <div className="empty-state">No administrator accounts found.</div>
                ) : administratorAccounts.map((listedAdmin) => (
                  <article className="users-signin-row" key={listedAdmin.id}>
                    <div className="users-signin-avatar" aria-hidden="true">
                      {(listedAdmin.name || listedAdmin.username || "A").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="users-signin-details">
                      <strong>{listedAdmin.name || listedAdmin.username || "Unnamed administrator"}</strong>
                      <span>{listedAdmin.username ? `@${listedAdmin.username}` : "Administrator account"}</span>
                    </div>
                    <div className="users-role-badge" aria-label="Administrator role">
                      Admin
                    </div>
                    {String(listedAdmin.uid || listedAdmin.id) !== String(currentUser?.uid)
                      && String(listedAdmin.id) !== String(currentUser?.uid) && (
                        <button
                          type="button"
                          className="users-remove-admin"
                          onClick={() => removeAdministrator(listedAdmin)}
                          disabled={removingAdminId === listedAdmin.id || totalAdmins <= 1}
                          title={totalAdmins <= 1 ? "At least one administrator must remain" : "Remove administrator access"}
                        >
                          {removingAdminId === listedAdmin.id ? "Updating..." : "Remove admin"}
                        </button>
                      )}
                  </article>
                ))}
              </div>
            </section>
            <section className="users-account-section regular-users-section" aria-labelledby="users-list-title">
              <div className="users-account-section-header">
                <h3 id="users-list-title">Users</h3>
                <span>{totalUsers}</span>
              </div>
              <div className="users-signin-list">
                {adminUsers.length === 0 ? (
                  <div className="empty-state">No user accounts found.</div>
                ) : adminUsers.map((listedUser) => (
                  <article className="users-signin-row" key={listedUser.id}>
                    <button
                      type="button"
                      className="users-signin-avatar"
                      onClick={() => setSelectedUserPicture({
                        name: listedUser.name || listedUser.username || "User",
                        image: listedUser.photoDataUrl || listedUser.photoURL,
                      })}
                      disabled={!listedUser.photoDataUrl && !listedUser.photoURL}
                      aria-label={`View ${listedUser.name || listedUser.username || "user"}'s profile picture`}
                      title={listedUser.photoDataUrl || listedUser.photoURL ? "View profile picture" : "No profile picture uploaded"}
                    >
                      {(listedUser.photoDataUrl || listedUser.photoURL)
                        ? <img src={listedUser.photoDataUrl || listedUser.photoURL} alt="" />
                        : (listedUser.name || listedUser.username || "U").slice(0, 1).toUpperCase()}
                    </button>
                    <div className="users-signin-details">
                      <strong>{listedUser.name || listedUser.username || "Unnamed user"}</strong>
                      <span>{listedUser.username ? `@${listedUser.username}` : listedUser.email || "User account"}</span>
                    </div>
                    <div className="users-signin-time">
                      <span>Last sign-in</span>
                      <strong>{listedUser.lastSignInAt ? formatDate(listedUser.lastSignInAt) : "Not recorded yet"}</strong>
                    </div>
                    <button
                      type="button"
                      className="users-promote-admin"
                      onClick={() => promoteUserToAdmin(listedUser)}
                      disabled={promotingUserId === listedUser.id}
                    >
                      {promotingUserId === listedUser.id ? "Updating..." : "Make admin"}
                    </button>
                    <button
                      type="button"
                      className="users-delete-account"
                      onClick={() => setDeleteUserTarget(listedUser)}
                      disabled={deletingUserId === listedUser.id}
                    >
                      {deletingUserId === listedUser.id ? "Deleting..." : "Delete account"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </div>
      )}

      {selectedUserPicture?.image && (
        <div
          className="statistics-overlay profile-picture-preview-overlay user-profile-preview-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedUserPicture(null);
          }}
        >
          <div className="profile-picture-preview-dialog" role="dialog" aria-modal="true" aria-label={`${selectedUserPicture.name}'s profile picture`}>
            <button type="button" className="modal-close" onClick={() => setSelectedUserPicture(null)} aria-label="Close picture preview">×</button>
            <img src={selectedUserPicture.image} alt={`${selectedUserPicture.name}'s profile`} />
          </div>
        </div>
      )}

      {/* =================================================
          ALL ANNOUNCEMENTS WINDOW
      ================================================= */}

      {showAnnouncementWindow && (

        <div
          className="statistics-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAnnouncementWindow(false);
            }
          }}
        >

          <div className="statistics-window">

            <div className="statistics-window-header">

              <div>

                <span className="panel-label">
                  WALASTIK
                </span>

                <h2>
                  All Announcements
                </h2>

                <p>
                  {announcements.length} announcement
                  {announcements.length === 1
                    ? ""
                    : "s"} available.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowAnnouncementWindow(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="statistics-window-list">

              {announcementLoading ? (

                <div className="empty-state">
                  Loading announcements...
                </div>

              ) : announcements.length === 0 ? (

                <div className="empty-state">
                  No announcements yet.
                </div>

              ) : (

                announcements.map(
                  (announcement) => (

                    <article
                      key={
                        `stat-${announcement.id}`
                      }
                      className={
                        `statistics-message-card announcement-card-clickable ${
                          announcement.pinned
                            ? "is-pinned"
                            : ""
                        }`
                      }
                      onClick={() =>
                        handleOpenAnnouncement(
                          announcement
                        )
                      }
                    >

                      {announcement.pinned && (
                        <span className="pinned-badge">
                          PINNED
                        </span>
                      )}

                      <h3>
                        {announcement.title}
                      </h3>

                      <p>
                        {announcement.content}
                      </p>

                      <div className="statistics-message-meta">

                        <span>
                          Posted{" "}
                          {formatDate(
                            announcement.createdAt ||
                            announcement.createdDate
                          )}
                        </span>

                        {announcement.pinned &&
                          announcement.pinnedBy && (
                            <span>
                              Pinned by{" "}
                              {
                                announcement.pinnedBy
                              }
                            </span>
                          )}

                      </div>

                      <div className="statistics-message-actions">

                        <button
                          type="button"
                          className={
                            announcement.pinned
                              ? "unpin-button"
                              : "pin-button"
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            if (
                              announcement.pinned
                            ) {
                              handleUnpin(
                                announcement
                              );
                            } else {
                              handlePinClick(
                                announcement
                              );
                            }
                          }}
                        >
                          {announcement.pinned
                            ? "Unpin"
                            : "Pin"}
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleDeleteAnnouncement(
                              announcement.id
                            );
                          }}
                        >
                          Delete
                        </button>

                      </div>

                    </article>

                  )
                )

              )}

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          ANNOUNCEMENT RIGHT SIDE SCREEN
      ================================================= */}

      {selectedAnnouncement && (

        <div
          className="announcement-side-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseAnnouncement();
            }
          }}
        >

          <aside
            className="announcement-side-panel"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="announcement-side-header">

              <div>

                <span className="panel-label">
                  WALASTIK ANNOUNCEMENT
                </span>

                <h2>
                  Announcement Details
                </h2>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseAnnouncement
                }
                aria-label="Close announcement"
              >
                ×
              </button>

            </div>

            <div className="announcement-side-content">

              {selectedAnnouncement.pinned && (
                <span className="pinned-badge">
                  PINNED
                </span>
              )}

              <h1>
                {selectedAnnouncement.title}
              </h1>

              <div className="announcement-side-meta">

                <span>
                  Posted{" "}
                  {formatDate(
                    selectedAnnouncement.createdAt ||
                    selectedAnnouncement.createdDate
                  )}
                </span>

                {selectedAnnouncement.pinned &&
                  selectedAnnouncement.pinnedBy && (
                    <span>
                      Pinned by{" "}
                      {
                        selectedAnnouncement.pinnedBy
                      }
                    </span>
                  )}

              </div>

              <div className="announcement-side-divider" />

              <div className="announcement-side-message">
                {selectedAnnouncement.content}
              </div>

            </div>

            <div className="announcement-side-actions">

              <button
                type="button"
                className={
                  selectedAnnouncement.pinned
                    ? "unpin-button"
                    : "pin-button"
                }
                onClick={() => {
                  if (
                    selectedAnnouncement.pinned
                  ) {
                    handleUnpin(
                      selectedAnnouncement
                    );
                  } else {
                    handlePinClick(
                      selectedAnnouncement
                    );
                  }
                }}
              >
                {selectedAnnouncement.pinned
                  ? "Unpin"
                  : "Pin"}
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={() => {
                  handleDeleteAnnouncement(
                    selectedAnnouncement.id
                  );
                }}
              >
                Delete
              </button>

            </div>

          </aside>

        </div>

      )}

      {/* =================================================
          KNOWLEDGE DETAIL SIDE SCREEN
      ================================================= */}

      {selectedKnowledge && (

        <div
          className="announcement-side-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseKnowledgeDetail();
            }
          }}
        >

          <aside
            className="announcement-side-panel"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="announcement-side-header">

              <div>

                <span className="panel-label">
                  {selectedKnowledge.source === "ai"
                    ? "WALASTIK AI KNOWLEDGE"
                    : "WALASTIK KNOWLEDGE"}
                </span>

                <h2>
                  Knowledge Details
                </h2>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseKnowledgeDetail
                }
                aria-label="Close knowledge"
              >
                ×
              </button>

            </div>

            <div className="announcement-side-content">

              {selectedKnowledge.pinned && (
                <span className="pinned-badge">
                  PINNED
                </span>
              )}

              <h1>
                {selectedKnowledge.title ||
                  "AI Answer"}
              </h1>

              {selectedKnowledge.source === "ai" &&
                selectedKnowledge.question && (
                  <>

                    <div className="announcement-side-meta">
                      <span>
                        Question
                      </span>
                    </div>

                    <div className="announcement-side-message">
                      {selectedKnowledge.question}
                    </div>

                  </>
                )}

              <div className="announcement-side-meta">

                <span>
                  Posted{" "}
                  {formatDate(
                    selectedKnowledge.createdAt ||
                    selectedKnowledge.createdDate ||
                    selectedKnowledge.pinnedAt ||
                    selectedKnowledge.pinnedDate
                  )}
                </span>

                {selectedKnowledge.pinnedBy && (
                  <span>
                    Pinned by{" "}
                    {selectedKnowledge.pinnedBy}
                  </span>
                )}

              </div>

              <div className="announcement-side-divider" />

              <div className="announcement-side-message">

                {selectedKnowledge.details ||
                  selectedKnowledge.content ||
                  "No knowledge details available."}

              </div>

              {selectedKnowledge.pinnedAt && (
                <div className="announcement-side-meta">

                  <span>
                    Pinned on{" "}
                    {formatDate(
                      selectedKnowledge.pinnedAt
                    )}
                  </span>

                </div>
              )}

            </div>

            <div className="announcement-side-actions">

              <button
                type="button"
                className="unpin-button"
                onClick={() => {
                  handleUnpin({
                    ...selectedKnowledge,
                    type: "knowledge",
                  });

                  handleCloseKnowledgeDetail();
                }}
              >
                Unpin
              </button>

            </div>

          </aside>

        </div>

      )}

      {/* =================================================
          PIN MODAL
      ================================================= */}

      <PinModal
        show={showPinModal}
        onClose={closePinModal}
        onPin={handlePinMessage}
        defaultName=""
        pinning={pinning}
      />

      {/* =================================================
          KNOWLEDGE / AI WINDOW
      ================================================= */}

      {showKnowledge && (

        <KnowledgePanel
          isAdmin={account?.role === "admin"}
          onClose={() =>
            setShowKnowledge(false)
          }
          onPin={handlePinClick}
          onUnpin={handleUnpin}
          pinningId={
            pinning
              ? pinTarget?.id
              : null
          }
        />

      )}

      {/* =================================================
          PINNED MESSAGES
      ================================================= */}

      {showPinned && (

        <div
          className="pinned-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowPinned(false);
            }
          }}
        >

          <div className="pinned-window">

            <div className="pinned-window-header">

              <div>

                <span className="panel-label">
                  WALASTIK
                </span>

                <h2>
                  Pinned Messages
                </h2>

                <p>
                  Important announcements and
                  knowledge saved for quick access.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowPinned(false)
                }
              >
                ×
              </button>

            </div>

            <div className="pinned-list">

              {totalPinned === 0 ? (

                <div className="empty-state">
                  No pinned messages yet.
                </div>

              ) : (

                <>

                  {/* PINNED ANNOUNCEMENTS */}

                  {pinnedAnnouncements.map(
                    (item) => (

                      <article
                        className="pinned-card announcement-card-clickable"
                        key={
                          `announcement-${item.id}`
                        }
                        onClick={() =>
                          handleOpenAnnouncement(
                            item
                          )
                        }
                      >

                        <span className="pinned-type">
                          ANNOUNCEMENT
                        </span>

                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {item.content}
                        </p>

                        <div className="pinned-card-meta">

                          <span>
                            Posted{" "}
                            {formatDate(
                              item.createdAt ||
                              item.createdDate
                            )}
                          </span>

                          {item.pinnedBy && (
                            <span>
                              Pinned by{" "}
                              {item.pinnedBy}
                            </span>
                          )}

                        </div>

                        <button
                          type="button"
                          className="unpin-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleUnpin(item);
                          }}
                        >
                          Unpin
                        </button>

                      </article>

                    )
                  )}

                  {/* PINNED KNOWLEDGE */}

                  {pinnedKnowledge.map(
                    (item) => (

                      <article
                        className="pinned-card announcement-card-clickable"
                        key={
                          `knowledge-${item.id}`
                        }
                        onClick={() =>
                          handleOpenKnowledgeDetail(
                            item
                          )
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();

                            handleOpenKnowledgeDetail(
                              item
                            );
                          }
                        }}
                      >

                        <span className="pinned-type">
                          {item.source === "ai"
                            ? "AI KNOWLEDGE"
                            : "KNOWLEDGE"}
                        </span>

                        <h3>
                          {item.title ||
                            "AI Answer"}
                        </h3>

                        {item.source === "ai" ? (
                          <div className="pinned-ai-answer">
                            {getAIAnswer(item)}
                          </div>
                        ) : (
                          <p>
                            {item.details || item.content || ""}
                          </p>
                        )}

                        <div className="pinned-card-meta">

                          <span>
                            Posted{" "}
                            {formatDate(
                              item.createdAt ||
                              item.createdDate ||
                              item.pinnedAt ||
                              item.pinnedDate
                            )}
                          </span>

                          {item.pinnedBy && (
                            <span>
                              Pinned by{" "}
                              {item.pinnedBy}
                            </span>
                          )}

                        </div>

                        <button
                          type="button"
                          className="unpin-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleUnpin({
                              ...item,
                              type: "knowledge",
                            });
                          }}
                        >
                          Unpin
                        </button>

                      </article>

                    )
                  )}

                </>

              )}

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          TOAST
      ================================================= */}

      <ConfirmDialog
        show={Boolean(announcementDeleteTarget)}
        title="Delete this announcement?"
        message={`Are you sure you want to delete “${announcementDeleteTarget?.title || "this announcement"}”? This action cannot be undone.`}
        onCancel={() => setAnnouncementDeleteTarget(null)}
        onConfirm={confirmDeleteAnnouncement}
        loading={Boolean(deletingAnnouncementId)}
      />

      <ConfirmDialog
        show={Boolean(grantAdminTarget)}
        label="ADMIN ACCESS"
        title={`Grant administrator access to ${grantAdminTarget?.name || grantAdminTarget?.username || "this user"}?`}
        message="They will be able to manage announcements, knowledge, and user accounts."
        cancelText="Cancel"
        confirmText="Grant admin"
        loadingText="Granting..."
        confirmVariant="primary"
        onCancel={() => setGrantAdminTarget(null)}
        onConfirm={confirmPromoteUserToAdmin}
        loading={Boolean(promotingUserId)}
      />

      <ConfirmDialog
        show={Boolean(removeAdminTarget)}
        label="ADMIN ACCESS"
        title={`Remove administrator access from ${removeAdminTarget?.name || removeAdminTarget?.username || "this administrator"}?`}
        message="Their account will remain active as a regular user."
        cancelText="Cancel"
        confirmText="Remove admin"
        loadingText="Removing..."
        onCancel={() => setRemoveAdminTarget(null)}
        onConfirm={confirmRemoveAdministrator}
        loading={Boolean(removingAdminId)}
      />

      <ConfirmDialog
        show={Boolean(deleteUserTarget)}
        label="DELETE USER ACCOUNT"
        title={`Permanently delete ${deleteUserTarget?.name || deleteUserTarget?.username || "this user"}'s account?`}
        message="This permanently deletes their sign-in account, user profile, username, and profile picture. This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete account"
        loadingText="Deleting..."
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={confirmDeleteUser}
        loading={Boolean(deletingUserId)}
      />

      <ConfirmDialog
        show={Boolean(knowledgeDeleteTarget)}
        title="Delete this knowledge?"
        message={`Are you sure you want to delete “${knowledgeDeleteTarget?.title || "this knowledge"}”? This action cannot be undone.`}
        onCancel={() => setKnowledgeDeleteTarget(null)}
        onConfirm={confirmDeleteKnowledgeFromDashboard}
        loading={Boolean(deletingKnowledgeId)}
      />

      {toast && (

        <div
          className={
            `app-toast ${
              toast.type === "error"
                ? "toast-error"
                : "toast-success"
            }`
          }
        >
          {toast.message}
        </div>

      )}

    </div>
  );
}

export default function App() {
  return <AuthGate><InformationCenter /></AuthGate>;
}
