/* eslint-disable max-len */
import {WriteBatch} from "firebase-admin/firestore";
import {db} from "../init/init";

export async function checkIfUserBlackListed(
    userId: string
) {
  let isUserBlacklistedData: any = null;
  const _isUserBlacklisted = await db.collection("xblack_list").doc(userId).get();
  if (_isUserBlacklisted.exists) {
    const _currentTime = Math.ceil(new Date().getTime() / 1000);
    isUserBlacklistedData = _isUserBlacklisted.data();
    if (isUserBlacklistedData?.is_blacklisted && (_currentTime - isUserBlacklistedData?.last_attempted) < 30*60) {
      isUserBlacklistedData.last_attempted = _currentTime;
      await db.collection("xblack_list").doc(userId).update(isUserBlacklistedData);
      return {success: false, message: "ERROR: Exceed Max Attempts", error: `User ${userId} exceeded maximum number of attempts for signup.`, isUserBlacklistedData};
    }
  }
  return {success: true, message: "NONE", error: "NONE", isUserBlacklistedData};
}

export async function deleteUserBlackList(
    batch: WriteBatch,
    userId: string
) {
  const _blacklistUser = db.collection("xblack_list").doc(userId);
  batch.delete(_blacklistUser);
  return batch;
}

export async function updateUserBlackListData(
    userId: string,
    timestamp: number,
    userBlackListData: any
) {
  try {
    if (userBlackListData) {
      if (userBlackListData?.attempts >= 2) {
        userBlackListData.attempts += 1;
        userBlackListData.last_attempted = timestamp;
        userBlackListData.is_blacklisted = true;
      } else {
        userBlackListData.attempts += 1;
        userBlackListData.last_attempted = timestamp;
      }
      await db.collection("xblack_list").doc(userId).update(userBlackListData);
    } else {
      await db.collection("xblack_list").doc(userId).set({
        attempts: 1,
        last_attempted: timestamp,
        is_blacklisted: false,
      });
    }
  } catch (err) {
    console.log("UpdateUserBlackList ERROR:", err);
  }
}
