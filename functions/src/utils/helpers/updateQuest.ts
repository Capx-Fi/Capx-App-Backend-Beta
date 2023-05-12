/* eslint-disable max-len */
import {db} from "../init/init";
import {WriteBatch} from "firebase-admin/firestore";

export async function updateRegisteredUser(
    orgId: string,
    questId: string,
    actionOrderIds: string[],
    batch: WriteBatch,
    userId: string,
    questUserCount: number
) {
  // 1. Update Registered User Count in Quest Collection.
  batch = await updateQuestCount(
      orgId,
      batch,
      questId,
      1 // Increment by 1
  );

  // 2. Update Registered User Count in Quest -> Action Collection.
  for (let i = 0; i < actionOrderIds.length; i++) {
    const actionId: string = actionOrderIds[i].toString();
    batch = await updateQuestActionCount(
        orgId,
        batch,
        questId,
        actionId,
        1 // Increment by 1
    );
  }

  // 3. Update Registered User ID in Quest Collection.
  batch = await updateQuestRegisteredUser(
      orgId,
      batch,
      userId,
      questId,
      questUserCount
  );

  // 4. Update Registered User ID in Quest -> Action Collection.
  for (let i = 0; i < actionOrderIds.length; i++) {
    const actionId: string = actionOrderIds[i].toString();
    batch = await updateQuestActionRegisteredUser(
        orgId,
        batch,
        userId,
        questId,
        actionId,
        questUserCount
    );
  }

  return batch;
}

async function updateQuestCount(
    orgId: string,
    batch: WriteBatch,
    questId: string,
    increment: number
) {
  const updateQuest = db.collection("xorgs").doc(orgId).collection("quests").doc(`${questId}`);
  const updateQuestObj = {
    "user_count": (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };
  batch.update(updateQuest, updateQuestObj);

  return batch;
}

export async function updateQuestCompletedCount(
    orgId: string,
    batch: WriteBatch,
    questId: string,
    increment: number
) {
  const updateQuest = db.collection("xorgs").doc(orgId).collection("quests").doc(`${questId}`);
  const updateQuestObj = {
    "completed_by": (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };
  batch.update(updateQuest, updateQuestObj);

  return batch;
}

async function updateQuestActionCount(
    orgId: string,
    batch: WriteBatch,
    questId: string,
    actionOrderId: string,
    increment: number
) {
  const updateQuestAction = db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("actions").doc(actionOrderId);
  const updateQuestActionObj = {
    "user_count": (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };
  batch.update(updateQuestAction, updateQuestActionObj);

  return batch;
}

async function updateQuestRegisteredUser(
    orgId: string,
    batch: WriteBatch,
    userId: string,
    questId: string,
    questUserCount: number
) {
  const _regDocId = Number(Math.floor((Number(questUserCount) + 1)/30).toFixed(0)) + 1;
  const regDoc = db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("registered_users").doc(`${_regDocId}`);

  const regDocExists = await regDoc.get();
  if (!regDocExists.exists) {
    // Create new Document.
    batch.create(
        regDoc,
        {
          "doc_Type": "Aggregate",
          "user_ids": [userId],
        }
    );
  } else {
    // Update old document.
    batch.update(
        regDoc,
        {
          "user_ids": (await import("firebase-admin/firestore")).FieldValue.arrayUnion(userId),
        }
    );
  }

  return batch;
}

async function updateQuestActionRegisteredUser(
    orgId: string,
    batch: WriteBatch,
    userId: string,
    questId: string,
    actionOrderId: string,
    questUserCount: number
) {
  const _regDocId = Number(Math.floor((Number(questUserCount) + 1)/30).toFixed(0)) + 1;
  const regDoc = db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("registered_users").doc(`${_regDocId}`);

  const regDocExists = await regDoc.get();
  if (!regDocExists.exists) {
    // Create new Document.
    const regDoc = db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("actions").doc(actionOrderId).collection("registered_users").doc(`${_regDocId}`);
    batch.create(
        regDoc,
        {
          "doc_Type": "Aggregate",
          "user_ids": [userId],
        }
    );
  } else {
    // Update old document.
    batch.update(
        regDoc,
        {
          "user_ids": (await import("firebase-admin/firestore")).FieldValue.arrayUnion(userId),
        }
    );
  }

  return batch;
}

export async function updateQuestClaimedRewards(
    increment: number
) {
  return {
    claimed_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };
}

export async function updateQuestActionOrderCall(
    questActionOrderId: string
) {
  const currentTime = Math.ceil(new Date().getTime() / 1000);
  const questOrderId: string = questActionOrderId.split("-")[0];

  await db.collection("xquest_order").doc(`${questOrderId}`).collection("action_order").doc(`${questActionOrderId}`).update({
    action_last_call: currentTime,
  });
}
