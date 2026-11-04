import React, { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { adminAccountAuth, auth, db, storage } from "../pages/firebase/firebase";
import LoadingScreen from "./LoadingScreen";

const USERNAME_EMAIL_DOMAIN = "accounts.walastik.local";
const SAVED_ACCOUNTS_KEY = "walastik-saved-accounts";
const deleteUserAccountCall = httpsCallable(getFunctions(auth.app), "deleteUserAccount");
const normalizeUsername = (value) => value.trim().toLowerCase();
const usernameEmail = (value) => `${normalizeUsername(value)}@${USERNAME_EMAIL_DOMAIN}`;
const usernameIndexDoc = (username) => doc(db, "usernameIndex", normalizeUsername(username));

const readSavedAccounts = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((account) => typeof account?.username === "string").slice(0, 5).map((account) => ({
        username: account.username,
        name: typeof account.name === "string" && account.name ? account.name : account.username,
        photoURL: typeof account.photoURL === "string" ? account.photoURL : "",
      }))
      : [];
  } catch {
    return [];
  }
};

const friendlyError = (error) => {
  const messages = {
    "auth/email-already-in-use": "That username is already taken.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "permission-denied": "Firestore denied a database operation. Check the browser console for the operation that was denied.",
    "auth/configuration-not-found": "Firebase Authentication is not set up for this project. In Firebase Console, open Authentication, choose Get started, then enable Email/Password sign-in.",
    "auth/operation-not-allowed": "Email/Password sign-in is disabled. Enable it in Firebase Console under Authentication → Sign-in method.",
  };
  return messages[error?.code] || error?.message || "Something went wrong. Please try again.";
};

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameLocked, setUsernameLocked] = useState(true);
  const [passwordLocked, setPasswordLocked] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedAccounts, setSavedAccounts] = useState(readSavedAccounts);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const passwordInputRef = useRef(null);

  const rememberAccount = (username, signedInUser) => {
    const existingAccount = savedAccounts.find((account) => account.username.toLowerCase() === username.toLowerCase());
    const savedAccount = {
      username,
      name: signedInUser.displayName || username,
      photoURL: signedInUser.photoURL || existingAccount?.photoURL || "",
    };
    const nextAccounts = [savedAccount, ...savedAccounts.filter((account) => account.username.toLowerCase() !== username.toLowerCase())].slice(0, 5);
    setSavedAccounts(nextAccounts);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    } catch {
      // Saved account shortcuts are optional if browser storage is unavailable.
    }
  };

  const forgetAccount = (username) => {
    const nextAccounts = savedAccounts.filter((account) => account.username !== username);
    setSavedAccounts(nextAccounts);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    } catch {
      // Ignore browser storage errors.
    }
  };

  const signInWithUsername = async (loginValue, loginPassword) => {
    if (loginValue.includes("@")) {
      return signInWithEmailAndPassword(auth, loginValue, loginPassword);
    }
    const normalizedLogin = normalizeUsername(loginValue);
    const usernameIndex = await getDoc(usernameIndexDoc(normalizedLogin));
    const authEmail = usernameIndex.exists()
      ? usernameIndex.data().authEmail
      : usernameEmail(normalizedLogin);
    return signInWithEmailAndPassword(auth, authEmail, loginPassword);
  };

  const offerBrowserPasswordSave = (loginValue, loginPassword, signedInUser) => {
    try {
      if (window.PasswordCredential && navigator.credentials?.store) {
        const browserCredential = new window.PasswordCredential({
          id: loginValue,
          password: loginPassword,
          name: signedInUser.displayName || loginValue,
        });
        navigator.credentials.store(browserCredential).catch(() => {});
      }
    } catch {
      // Browser password saving is optional; never store passwords in app storage.
    }
  };

  const signInUsingSavedPassword = async (username, savedPassword) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const credential = await signInWithUsername(username, savedPassword);
      rememberAccount(username, credential.user);
      return true;
    } catch (signInError) {
      setError(friendlyError(signInError));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const selectSavedAccount = async (savedAccount) => {
    setUsernameInput(savedAccount.username);
    setPassword("");
    setShowPassword(false);
    setUsernameLocked(false);
    setPasswordLocked(false);
    setError("");
    setNotice("");
    setShowSavedAccounts(false);

    if (!navigator.credentials?.get) return;
    let browserCredential = null;
    try {
      browserCredential = await navigator.credentials.get({ password: true, mediation: "required" });
    } catch {
      // Fall back to a password already filled by the browser, or manual entry.
    }
    if (browserCredential?.password && normalizeUsername(browserCredential.id || "") === normalizeUsername(savedAccount.username)) {
      await signInUsingSavedPassword(savedAccount.username, browserCredential.password);
      return;
    }
    window.setTimeout(() => {
      const browserFilledPassword = passwordInputRef.current?.value;
      if (browserFilledPassword) signInUsingSavedPassword(savedAccount.username, browserFilledPassword);
      else passwordInputRef.current?.focus();
    }, 250);
  };

  useEffect(() => {
    let isActive = true;
    const loadSavedAccountPictures = async () => {
      if (!savedAccounts.length) return;
      const updatedAccounts = await Promise.all(savedAccounts.map(async (savedAccount) => {
        try {
          const field = savedAccount.username.includes("@") ? "authEmail" : "username";
          const value = field === "username" ? normalizeUsername(savedAccount.username) : savedAccount.username;
          const snapshot = await getDocs(query(collection(db, "users"), where(field, "==", value), limit(1)));
          if (snapshot.empty) return savedAccount;
          const accountProfile = snapshot.docs[0].data();
          return {
            ...savedAccount,
            name: accountProfile.name || savedAccount.name,
            photoURL: accountProfile.photoDataUrl || accountProfile.photoURL || savedAccount.photoURL,
          };
        } catch {
          return savedAccount;
        }
      }));
      const changed = updatedAccounts.some((account, index) => account.name !== savedAccounts[index].name || account.photoURL !== savedAccounts[index].photoURL);
      if (!isActive || !changed) return;
      setSavedAccounts(updatedAccounts);
      try {
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
      } catch {
        // Ignore browser storage errors.
      }
    };
    loadSavedAccountPictures();
    return () => { isActive = false; };
  }, [savedAccounts]);

  useEffect(() => {
    let isActive = true;
    let unsubscribeProfile = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setUser(currentUser);
      setChecking(true);
      if (!currentUser) {
        setProfile(null);
        setChecking(false);
        return;
      }

      try {
        const profileSnapshot = await getDocs(query(
          collection(db, "users"),
          where("uid", "==", currentUser.uid),
          limit(1)
        ));
        if (!isActive) return;
        if (profileSnapshot.empty) {
          setProfile({ uid: currentUser.uid, role: "user", name: currentUser.displayName || "", photoURL: currentUser.photoURL || "" });
        } else {
          const profileDoc = profileSnapshot.docs[0];
          const profileRef = doc(db, "users", profileDoc.id);
          setProfile({ ...profileDoc.data(), photoURL: profileDoc.data().photoDataUrl || profileDoc.data().photoURL || currentUser.photoURL || "" });
          unsubscribeProfile = onSnapshot(profileRef, (updatedProfile) => {
            if (!isActive || !updatedProfile.exists()) return;
            const data = updatedProfile.data();
            setProfile({ ...data, photoURL: data.photoDataUrl || data.photoURL || currentUser.photoURL || "" });
          }, (profileError) => {
            console.error("Unable to watch the signed-in user's profile:", profileError);
          });
          try {
            await updateDoc(profileRef, {
              lastSignInAt: serverTimestamp(),
            });
            if (profileDoc.data().username && profileDoc.data().authEmail) {
              await setDoc(usernameIndexDoc(profileDoc.data().username), {
                uid: currentUser.uid,
                authEmail: profileDoc.data().authEmail,
              });
            }
          } catch (trackingError) {
            console.warn("Unable to update sign-in metadata or username index:", trackingError);
          }
        }
      } catch (loadError) {
        if (!isActive) return;
        console.warn("Unable to load the account profile; opening the signed-in account with basic details:", loadError);
        setProfile({
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split("@")[0] || "",
          username: currentUser.email?.split("@")[0] || "",
          authEmail: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          role: "user",
        });
      } finally {
        if (isActive) setChecking(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const submitStartedAt = Date.now();
    let submitStage = "validating account details";
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (!usernameInput.trim()) throw new Error("Enter your username.");
      if (!password) throw new Error("Enter your password.");
      if (mode === "login") {
        const loginValue = usernameInput.trim();
        const credential = await signInWithUsername(loginValue, password);
        rememberAccount(loginValue, credential.user);
        offerBrowserPasswordSave(loginValue, password, credential.user);
      } else {
        const isAdminSetup = mode === "admin";
        const username = normalizeUsername(usernameInput);
        if (!name.trim()) throw new Error("Enter your name.");
        if (!/^[a-z0-9._-]{3,24}$/.test(username)) throw new Error("Username must be 3–24 characters and use only letters, numbers, dots, underscores, or hyphens.");
        if (password.length < 6) throw new Error("Choose a password with at least 6 characters.");
        const authEmail = usernameEmail(username);
        submitStage = "creating the Authentication account";
        const credential = await createUserWithEmailAndPassword(auth, authEmail, password);
        submitStage = "saving the Authentication profile";
        await updateProfile(credential.user, { displayName: name.trim() });
        const nextProfile = { uid: credential.user.uid, name: name.trim(), username, authEmail, role: isAdminSetup ? "admin" : "user", createdAt: new Date().toISOString(), lastSignInAt: serverTimestamp() };
        if (isAdminSetup) {
          const userDocRef = doc(db, "users", credential.user.uid);
          const bootstrapDocRef = doc(db, "system", "adminBootstrap");
          const usernameDocRef = usernameIndexDoc(username);
          submitStage = "checking for an existing user profile";
          const previousProfile = await getDoc(userDocRef);
          let usernameIndexCreated = false;
          try {
            submitStage = "writing users/{uid}";
            await setDoc(userDocRef, nextProfile);
            submitStage = "writing the username sign-in index";
            await setDoc(usernameDocRef, { uid: credential.user.uid, authEmail });
            usernameIndexCreated = true;
            submitStage = "writing system/adminBootstrap";
            await setDoc(bootstrapDocRef, {
              uid: credential.user.uid,
              completedAt: serverTimestamp(),
            });
          } catch (setupError) {
            if (usernameIndexCreated) {
              try {
                await deleteDoc(usernameDocRef);
              } catch {
                // Preserve the setup error if cleanup is denied.
              }
            }
            if (!previousProfile.exists()) {
              try {
                await deleteDoc(userDocRef);
              } catch {
                // Preserve the original setup error if cleanup is denied.
              }
            }
            try {
              await deleteUser(credential.user);
            } catch {
              // Ignore cleanup failures when the auth account is already gone.
            }
            throw setupError;
          }
        } else {
          submitStage = "creating the user profile";
          const userDocRef = doc(db, "users", credential.user.uid);
          let usernameIndexCreated = false;
          try {
            await setDoc(userDocRef, nextProfile);
            submitStage = "creating the username sign-in index";
            await setDoc(usernameIndexDoc(username), { uid: credential.user.uid, authEmail });
            usernameIndexCreated = true;
          } catch (setupError) {
            if (usernameIndexCreated) {
              try {
                await deleteDoc(usernameIndexDoc(username));
              } catch {
                // Preserve the original setup error if cleanup is denied.
              }
            }
            try {
              await deleteDoc(userDocRef);
            } catch {
              // Preserve the original setup error if the profile was not created.
            }
            try {
              await deleteUser(credential.user);
            } catch {
              // Preserve the original setup error if Auth cleanup fails.
            }
            throw setupError;
          }
        }
        setProfile(nextProfile);
        rememberAccount(username, credential.user);
        offerBrowserPasswordSave(username, password, credential.user);
        setNotice(isAdminSetup ? "Administrator account created." : "Account created successfully.");
        setName("");
        setUsernameInput("");
        setPassword("");
        setShowPassword(false);
        setUsernameLocked(true);
        setPasswordLocked(true);
      }
    } catch (submitError) {
      if (submitError?.code === "permission-denied") {
        console.error(`Firestore denied account setup while ${submitStage}:`, submitError);
        if (mode === "admin") {
          setError("First administrator setup has already been used for this project. To add another admin, sign in with a user account and ask an existing admin to create the new administrator account from the account activity window.");
        } else {
          const firebaseDetail = [submitError.code, submitError.message].filter(Boolean).join(": ");
          setError(`Firestore denied account setup while ${submitStage}. Firebase reported: ${firebaseDetail || "permission-denied"}`);
        }
      } else {
        setError(friendlyError(submitError));
      }
      if (mode === "login") {
        setUsernameInput("");
        setPassword("");
        setShowPassword(false);
        setUsernameLocked(true);
        setPasswordLocked(true);
      }
    } finally {
      if (mode !== "login") {
        const remainingDisplayTime = 650 - (Date.now() - submitStartedAt);
        if (remainingDisplayTime > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDisplayTime));
        }
      }
      setBusy(false);
    }
  };

  const handleDeleteAccount = async (currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Sign in again before deleting this account.");
    if (!currentPassword) throw new Error("Enter your password to confirm account deletion.");
    await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, currentPassword));
    try {
      await deleteObject(ref(storage, `profile-pictures/${currentUser.uid}`));
    } catch (storageError) {
      if (storageError?.code !== "storage/object-not-found") throw storageError;
    }
    const profiles = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid), limit(1)));
    if (!profiles.empty) {
      const userProfile = profiles.docs[0].data();
      if (userProfile.username) {
        const usernameRef = usernameIndexDoc(userProfile.username);
        const usernameMapping = await getDoc(usernameRef);
        if (usernameMapping.exists() && usernameMapping.data().uid === currentUser.uid) {
          await deleteDoc(usernameRef);
        }
      }
      await deleteDoc(doc(db, "users", profiles.docs[0].id));
    }
    await deleteUser(currentUser);
  };

  const handleDeleteUserAccount = async (targetUid) => {
    if (!auth.currentUser || profile?.role !== "admin") {
      throw new Error("Only a signed-in administrator can delete user accounts.");
    }
    if (targetUid === auth.currentUser.uid) {
      throw new Error("You cannot delete your own account from this panel.");
    }
    await deleteUserAccountCall({ uid: targetUid });
  };

  const handleUpdateUsername = async (nextUsernameValue, currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) throw new Error("Sign in again before changing your username.");
    const nextUsername = normalizeUsername(nextUsernameValue);
    if (!/^[a-z0-9._-]{3,24}$/.test(nextUsername)) {
      throw new Error("Username must be 3–24 characters and use only letters, numbers, dots, underscores, or hyphens.");
    }
    if (!currentPassword) throw new Error("Enter your current password to confirm this change.");
    if (nextUsername === normalizeUsername(profile?.username || currentUser.email.split("@")[0])) return profile;

    await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, currentPassword));
    const nextUsernameRef = usernameIndexDoc(nextUsername);
    const existingUsername = await getDoc(nextUsernameRef);
    if (existingUsername.exists() && existingUsername.data().uid !== currentUser.uid) {
      throw Object.assign(new Error("That username is already taken."), { code: "auth/email-already-in-use" });
    }
    const profiles = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid), limit(1)));
    if (profiles.empty) throw new Error("Your account profile could not be found in Firestore.");

    const previousUsername = normalizeUsername(profile?.username || currentUser.email.split("@")[0]);
    const profileRef = doc(db, "users", profiles.docs[0].id);
    const currentAuthEmail = profile?.authEmail || currentUser.email;
    const oldUsernameRef = usernameIndexDoc(previousUsername);
    await updateDoc(profileRef, { username: nextUsername });
    try {
      await setDoc(nextUsernameRef, { uid: currentUser.uid, authEmail: currentAuthEmail });
      if (previousUsername !== nextUsername) {
        const oldUsername = await getDoc(oldUsernameRef);
        if (oldUsername.exists() && oldUsername.data().uid === currentUser.uid) {
          await deleteDoc(oldUsernameRef);
        }
      }
    } catch (profileError) {
      try {
        if (nextUsername !== previousUsername) await deleteDoc(nextUsernameRef);
        await updateDoc(profileRef, { username: previousUsername });
      } catch (rollbackError) {
        console.error("Unable to remove the new username index after the profile update failed:", rollbackError);
        throw new Error(`Username update failed and rollback could not be completed. Contact the administrator. ${profileError.message}`);
      }
      throw profileError;
    }

    const updatedProfile = { ...profile, username: nextUsername, authEmail: currentAuthEmail };
    setProfile(updatedProfile);
    offerBrowserPasswordSave(nextUsername, currentPassword, currentUser);
    const nextAccounts = savedAccounts.map((savedAccount) => (
      normalizeUsername(savedAccount.username) === normalizeUsername(profile?.username || currentUser.email.split("@")[0])
        ? { ...savedAccount, username: nextUsername }
        : savedAccount
    ));
    setSavedAccounts(nextAccounts);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    } catch {
      // Saved account shortcuts are optional.
    }
    return updatedProfile;
  };

  const handleChangePassword = async (currentPassword, nextPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) throw new Error("Sign in again before changing your password.");
    if (!currentPassword) throw new Error("Enter your current password.");
    if (nextPassword.length < 6) throw new Error("Choose a new password with at least 6 characters.");
    await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, currentPassword));
    await updatePassword(currentUser, nextPassword);
    offerBrowserPasswordSave(profile?.username || currentUser.email, nextPassword, currentUser);
  };

  const handleUpdateName = async (nameValue) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Sign in again before changing your name.");
    const name = nameValue.trim();
    if (!name) throw new Error("Enter your name.");
    if (name.length > 80) throw new Error("Name must be 80 characters or fewer.");

    const profiles = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid), limit(1)));
    if (profiles.empty) throw new Error("Your account profile could not be found in Firestore.");
    const profileRef = doc(db, "users", profiles.docs[0].id);
    const previousName = profile?.name || currentUser.displayName || "";

    await updateDoc(profileRef, { name });
    try {
      await updateProfile(currentUser, { displayName: name });
    } catch (updateError) {
      try {
        await updateDoc(profileRef, { name: previousName });
      } catch (rollbackError) {
        console.error("Unable to restore the previous profile name:", rollbackError);
        throw new Error(`Name update failed and the previous name could not be restored. Contact the administrator. ${updateError.message}`);
      }
      throw updateError;
    }

    const updatedProfile = { ...profile, name };
    setProfile(updatedProfile);
    const username = updatedProfile.username;
    if (username) {
      const nextAccounts = savedAccounts.map((savedAccount) => (
        normalizeUsername(savedAccount.username) === normalizeUsername(username)
          ? { ...savedAccount, name }
          : savedAccount
      ));
      setSavedAccounts(nextAccounts);
      try {
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      } catch {
        // Saved account shortcuts are optional.
      }
    }
    return updatedProfile;
  };

  const handleCreateAccountForAdmin = async (displayNameValue, usernameValue, password, role) => {
    const currentUser = auth.currentUser;
    if (!currentUser || profile?.role !== "admin") {
      throw new Error("Only a signed-in administrator can create accounts from this panel.");
    }
    if (role !== "admin" && role !== "user") throw new Error("Choose either an admin or user account.");

    const displayName = displayNameValue.trim();
    const username = normalizeUsername(usernameValue);
    if (!displayName) throw new Error("Enter the new account's name.");
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      throw new Error("Username must be 3–24 characters and use only letters, numbers, dots, underscores, or hyphens.");
    }
    if (password.length < 6) throw new Error("Choose a password with at least 6 characters.");

    const authEmail = usernameEmail(username);
    let newCredential;
    let profileCreated = false;
    let usernameIndexCreated = false;
    try {
      newCredential = await createUserWithEmailAndPassword(adminAccountAuth, authEmail, password);
      await updateProfile(newCredential.user, { displayName });
      await setDoc(doc(db, "users", newCredential.user.uid), {
        uid: newCredential.user.uid,
        name: displayName,
        username,
        authEmail,
        role,
        createdAt: new Date().toISOString(),
        lastSignInAt: serverTimestamp(),
      });
      profileCreated = true;
      await setDoc(usernameIndexDoc(username), { uid: newCredential.user.uid, authEmail });
      usernameIndexCreated = true;
      return { uid: newCredential.user.uid, name: displayName, username, authEmail, role };
    } catch (createError) {
      if (newCredential?.user) {
        if (usernameIndexCreated) {
          try {
            await deleteDoc(usernameIndexDoc(username));
          } catch (cleanupError) {
            console.error("Unable to remove the username index after account creation failed:", cleanupError);
          }
        }
        if (profileCreated) {
          try {
            await deleteDoc(doc(db, "users", newCredential.user.uid));
          } catch (cleanupError) {
            console.error("Unable to remove the Firestore profile after account creation failed:", cleanupError);
          }
        }
        try {
          await deleteUser(newCredential.user);
        } catch (cleanupError) {
          console.error("Unable to clean up the new Authentication account after admin creation failed:", cleanupError);
        }
      }
      throw createError;
    } finally {
      if (adminAccountAuth.currentUser) {
        await signOut(adminAccountAuth);
      }
    }
  };

  const handleUploadProfilePicture = async (file, onStage) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Sign in again before changing your profile picture.");
    if (!file || !file.type.startsWith("image/")) throw new Error("Choose an image file.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Choose an image smaller than 20 MB.");
    onStage?.("Preparing picture...");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let maxDimension = 1600;
    let quality = 0.9;
    let compressedBlob = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const attemptQuality = quality;
      compressedBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", attemptQuality));
      if (!compressedBlob) break;
      if (compressedBlob.size <= 640 * 1024) break;
      if (quality > 0.66) quality -= 0.08;
      else {
        maxDimension = Math.round(maxDimension * 0.82);
        quality = 0.86;
      }
    }
    bitmap.close();
    if (!compressedBlob) throw new Error("This image could not be prepared for upload.");
    if (compressedBlob.size > 640 * 1024) throw new Error("This image could not be compressed enough to save. Try a smaller image.");
    onStage?.("Saving picture...");
    const photoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("This picture could not be read. Please try another image."));
      reader.readAsDataURL(compressedBlob);
    });
    if (photoDataUrl.length > 900000) throw new Error("This image is still too large after compression. Try a smaller image.");
    const profiles = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid), limit(1)));
    if (!profiles.empty) {
      await updateDoc(doc(db, "users", profiles.docs[0].id), { photoDataUrl });
    } else {
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        name: currentUser.displayName || "",
        username: currentUser.email?.split("@")[0] || "",
        authEmail: currentUser.email || "",
        role: "user",
        photoDataUrl,
      });
    }
    setProfile((current) => ({ ...current, photoDataUrl }));
    const username = currentUser.email?.split("@")[0] || "";
    if (username) {
      const nextAccounts = savedAccounts.map((savedAccount) => savedAccount.username.toLowerCase() === username.toLowerCase()
        ? { ...savedAccount, photoURL: photoDataUrl }
        : savedAccount);
      setSavedAccounts(nextAccounts);
      try {
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      } catch {
        // Keep saved account shortcuts optional if browser storage is unavailable.
      }
    }
    onStage?.("Picture saved.");
    return photoDataUrl;
  };

  if (checking) return <div className="auth-loading">Loading your account…</div>;
  if (busy && mode !== "login") {
    return <LoadingScreen message={mode === "admin" ? "Setting up administrator account..." : "Creating your account..."} />;
  }
  if (user && profile) return <>{React.cloneElement(children, { currentUser: user, account: profile, onSignOut: () => signOut(auth), onDeleteAccount: handleDeleteAccount, onDeleteUserAccount: handleDeleteUserAccount, onUpdateUsername: handleUpdateUsername, onUpdateName: handleUpdateName, onChangePassword: handleChangePassword, onCreateAccountForAdmin: handleCreateAccountForAdmin, onUploadProfilePicture: handleUploadProfilePicture })}</>;

  return (
    <main className="auth-screen" style={{ "--auth-background-image": "url('/login-background.jpg')" }}>
      <section className="auth-card">
        <span className="auth-eyebrow">WALASTIK ENTERPRISE</span>
        <h1>{showSavedAccounts ? "Choose an account" : mode === "login" ? "Welcome back" : mode === "admin" ? "Set up administrator" : "Create your account"}</h1>
        <p className="auth-description">{showSavedAccounts ? "Select an account to continue signing in." : "Sign in to access the Information Center."}</p>
        {mode === "login" && savedAccounts.length > 0 && !showSavedAccounts && (
          <button type="button" className="open-saved-accounts" onClick={() => setShowSavedAccounts(true)}>Choose a saved account <span>({savedAccounts.length})</span></button>
        )}
        {showSavedAccounts && mode === "login" && (
          <section className="saved-accounts-screen" aria-label="Previously signed-in accounts">
            {savedAccounts.map((savedAccount) => (
              <div className="saved-account-row" key={savedAccount.username}>
                <button type="button" className="saved-account-select" onClick={() => selectSavedAccount(savedAccount)} disabled={busy}>
                  <span className="saved-account-avatar">{savedAccount.photoURL ? <img src={savedAccount.photoURL} alt="" /> : savedAccount.name.slice(0, 1).toUpperCase()}</span>
                  <span>{savedAccount.name}</span>
                  <small>{savedAccount.username}</small>
                </button>
                <button type="button" className="saved-account-remove" onClick={() => forgetAccount(savedAccount.username)} aria-label={`Remove ${savedAccount.username} from saved accounts`}>×</button>
              </div>
            ))}
            <span className="saved-account-note">Select an account, then choose its saved password in the browser prompt to sign in automatically.</span>
            <button type="button" className="saved-account-back" onClick={() => setShowSavedAccounts(false)}>Back to sign in</button>
          </section>
        )}
        {!showSavedAccounts && <>
        <form className="auth-form" autoComplete="on" onSubmit={handleSubmit}>
          {mode !== "login" && <label>Name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label>Username<input type="text" name="username" autoComplete={mode === "login" ? "username" : "off"} autoCapitalize="none" spellCheck="false" readOnly={usernameLocked} onFocus={() => setUsernameLocked(false)} value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} minLength={mode === "login" ? undefined : 3} maxLength={24} required /></label>
          <label>Password
            <span className="password-input-wrap">
              <input ref={passwordInputRef} type={showPassword ? "text" : "password"} name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} readOnly={passwordLocked} onFocus={() => setPasswordLocked(false)} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
              <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {!showPassword && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </span>
          </label>
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-message" role="status">{notice}</p>}
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "admin" ? "Create administrator" : "Create account"}</button>
        </form>
        <div className="auth-links">
          <button type="button" onClick={() => { setError(""); setNotice(""); setName(""); setUsernameInput(""); setPassword(""); setShowPassword(false); setUsernameLocked(true); setPasswordLocked(true); setMode(mode === "login" ? "signup" : "login"); }}> {mode === "login" ? "Create a user account" : "Back to sign in"}</button>
          {mode === "login" && <button type="button" onClick={() => { setError(""); setNotice(""); setName(""); setUsernameInput(""); setPassword(""); setShowPassword(false); setUsernameLocked(true); setPasswordLocked(true); setMode("admin"); }}>First time? Set up admin</button>}
        </div>
        {mode === "admin" && <p className="auth-note">This creates the first administrator account for this app.</p>}
        </>}
      </section>
    </main>
  );
}
