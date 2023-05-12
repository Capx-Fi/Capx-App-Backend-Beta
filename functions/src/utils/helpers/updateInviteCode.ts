/* eslint-disable max-len */
import {db} from "../init/init";
import {DocumentData, DocumentReference, WriteBatch} from "firebase-admin/firestore";

export async function updateInviteCodeUserRecord(
    batch: WriteBatch,
    inviteCode: string,
    inviterType: string,
    invitedUserId: string,
    noOfInvites: number,
) {
  try {
    // Check user type:
    const inviteCodeTemp: any = {};
    inviteCodeTemp["invited_users"] = (await import("firebase-admin/firestore")).FieldValue.arrayUnion(invitedUserId);
    if (inviterType === (await import("../enums/userType")).UserType.OGInviter) {
      inviteCodeTemp["invited_users"] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
    }

    const _inviteCodeUpdate = db.collection("xinvite_codes").doc(inviteCode);
    batch.update(_inviteCodeUpdate, inviteCodeTemp);

    if (inviterType === (await import("../enums/userType")).UserType.OGInviter) {
      // Update the invited user.
      batch = await updateOGInviteCodeUser(batch, noOfInvites, inviteCode, invitedUserId);
    }
    return batch;
  } catch (err) {
    return batch;
  }
}

async function updateOGInviteCodeUser(
    batch: WriteBatch,
    noOfInvites: number,
    inviteCode: string,
    invitedUserId: string,
) {
  try {
    const _inviteDocId = Number(Math.floor((Number(noOfInvites) + 1)/20).toFixed(0)) + 1;
    const _inviteCodePath = db.collection("xinvite_codes").doc(inviteCode).collection("invited_users").doc(`${_inviteDocId}`);
    const _inviteDocExists = await _inviteCodePath.get();
    if (_inviteDocExists.exists) {
      batch.update(_inviteCodePath, {"user_ids": (await import("firebase-admin/firestore")).FieldValue.arrayUnion(invitedUserId)});
    } else {
      batch.create(_inviteCodePath, {
        "docType": "Aggregate",
        "user_ids": [invitedUserId],
      });
    }
    return batch;
  } catch (err) {
    console.log("ERROR: Updating OG Invited User -", err);
    return batch;
  }
}

export async function updateInviteCodeMaxInvites(
    inviteCodeRef : DocumentReference<DocumentData>,
    inviterType: string,
    currentUsedInvites: number,
    currentMaxInvites: number,
) {
  const batch = db.batch();
  let newMaxInvites = currentMaxInvites;
  try {
    if (inviterType === (await import("../enums/userType")).UserType.Individual) {
      if (currentMaxInvites === 3) {
        batch.update(inviteCodeRef, {max_invites: 10});
        batch.update(inviteCodeRef.collection("invites").doc("invites"), {max_invites: 10});
        newMaxInvites = 10;
        await batch.commit();
      }
    } else if (inviterType === (await import("../enums/userType")).UserType.OGInviter) {
      if (currentUsedInvites > currentMaxInvites*0.9) {
        if (currentMaxInvites + 100 <= 1000) {
          batch.update(inviteCodeRef, {max_invites: currentMaxInvites+100});
          batch.update(inviteCodeRef.collection("invites").doc("og_invites"), {max_invites: currentMaxInvites+100});
          currentMaxInvites += 100;
          await batch.commit();
        }
      }
    }
    return newMaxInvites;
  } catch (err) {
    console.log("ERROR: Updating Invite Code Max Invites", err);
    return newMaxInvites;
  }
}
