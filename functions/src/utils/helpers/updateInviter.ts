/* eslint-disable max-len */
import {db} from "../init/init";
import {WriteBatch} from "firebase-admin/firestore";

export async function updateInviterRewards(
    batch: WriteBatch,
    inviterId: string,
    invitedUserCount: number,
    rewardIncrement: number
) {
  const _inviter = db.collection("xusers").doc(inviterId);
  batch.update(
      _inviter,
      {
        "earned_rewards": (await import("firebase-admin/firestore")).FieldValue.increment(rewardIncrement),
        "invites": (await import("firebase-admin/firestore")).FieldValue.increment(invitedUserCount),
      }
  );
  return batch;
}

export async function updateInviterInvitedUserData(
    batch: WriteBatch,
    inviterId: string,
    invitedUserId: string,
    inviterType: string
) {
  const __invitesDoc = inviterType === (await import("../enums/userType")).UserType.OGInviter ? "og_invites" : "invites";
  const __invitesUpdateDoc = inviterType === (await import("../enums/userType")).UserType.OGInviter ? {"invited_users": (await import("firebase-admin/firestore")).FieldValue.increment(1)} : {"invited_users": (await import("firebase-admin/firestore")).FieldValue.arrayUnion(invitedUserId)};

  const _inviterInvitesDoc = db.collection("xusers").doc(inviterId).collection("invites").doc(__invitesDoc);
  batch.update(_inviterInvitesDoc, __invitesUpdateDoc);

  return batch;
}

export async function updateSuperInviterRewards(
    batch: WriteBatch,
    superInviterId: string,
    reward: number
) {
  const __superInviter = db.collection("xusers").doc(superInviterId);
  batch.update(
      __superInviter,
      {
        "earned_rewards": (await import("firebase-admin/firestore")).FieldValue.increment(reward),
      }
  );

  return batch;
}
