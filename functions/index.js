const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

initializeApp();

exports.deleteUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in as an administrator to delete accounts.");
  }

  const adminProfile = await getFirestore().doc(`users/${request.auth.uid}`).get();
  if (adminProfile.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can delete user accounts.");
  }

  const targetUid = request.data?.uid;
  if (typeof targetUid !== "string" || targetUid.length < 1 || targetUid.length > 128) {
    throw new HttpsError("invalid-argument", "A valid user account ID is required.");
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account from this panel.");
  }

  const db = getFirestore();
  const userProfiles = await db.collection("users").where("uid", "==", targetUid).get();
  const profiles = new Map(userProfiles.docs.map((profile) => [profile.id, profile]));
  const profileByUid = await db.doc(`users/${targetUid}`).get();
  if (profileByUid.exists) profiles.set(profileByUid.id, profileByUid);

  if (profiles.size === 0) {
    throw new HttpsError("not-found", "The user profile could not be found.");
  }
  if (Array.from(profiles.values()).some((profile) => profile.data().role === "admin")) {
    throw new HttpsError("failed-precondition", "Administrator accounts must be demoted before they can be deleted.");
  }

  try {
    await getAuth().deleteUser(targetUid);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
  }

  try {
    for (const profile of profiles.values()) {
      const username = profile.data().username;
      if (typeof username === "string" && username.trim()) {
        const usernameRef = db.doc(`usernameIndex/${username.trim().toLowerCase()}`);
        const usernameIndex = await usernameRef.get();
        if (usernameIndex.exists && usernameIndex.data().uid === targetUid) {
          await usernameRef.delete();
        }
      }
    }

    const bucket = getStorage().bucket();
    await bucket.file(`profile-pictures/${targetUid}`).delete({ ignoreNotFound: true });

    const batch = db.batch();
    profiles.forEach((profile) => batch.delete(profile.ref));
    await batch.commit();
  } catch (error) {
    logger.error("Authentication account was deleted, but profile cleanup failed.", {
      targetUid,
      error,
    });
    throw new HttpsError(
      "internal",
      "The sign-in account was deleted, but some profile data could not be cleaned up. Retry deletion to finish cleanup."
    );
  }

  return { uid: targetUid, deleted: true };
});
