/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function completeQuest(
    batch: WriteBatch,
    user: any,
    action: any,
    inputData: any,
    questOrder: any,
    userId: string,
    actionId: number,
    actionOrderId: string,
    questOrderId: string
) {
  try {
    // 1. Create Quest Object.
    const questOrderObj = await createQuestOrderObj(action, actionId, questOrder, actionOrderId);
    const questOrderRef = db.collection("xquest_order").doc(`${questOrderId}`);

    batch.update(questOrderRef, questOrderObj);

    // 2. Create Action Object for Completion.
    const actionOrderObj = await createActionOrderObj(action, inputData);
    const actionOrderRef = questOrderRef.collection("action_order").doc(`${actionOrderId}`);

    batch.update(actionOrderRef, actionOrderObj);

    // 3. Update Quest.
    batch = await updateQuest(batch, questOrder, actionId, questOrderId);

    // 4. Update User.
    const userUpdate = await updateUser(batch, user, action, userId, questOrder, questOrderId, actionId);
    if (!userUpdate.success) {
      return {
        success: userUpdate.success,
        error: userUpdate.error,
        message: userUpdate.message,
        batch,
      };
    }

    batch = userUpdate.batch;

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch: batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: \nError Details: \t${err}`,
      batch,
    };
  }
}

async function createActionOrderObj(
    action: any,
    inputData: any
) {
  let actionOrderObj: any = {};

  // Generalised Construction of Action Order.
  actionOrderObj["action_order_status"] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  actionOrderObj["is_claimed"] = true;

  actionOrderObj = await addActionOrderAttributeForActionType(action, inputData, actionOrderObj);

  return actionOrderObj;
}

async function addActionOrderAttributeForActionType(
    action: any,
    inputData: any,
    actionOrderObj: any
) {
  if (
    action?.type === (await import("../../enums/actionType")).ActionType.Notify
  ) {
    actionOrderObj["action_notifiying_email"] = inputData?.email.trim();
  } else if (
    action?.type === (await import("../../enums/actionType")).ActionType.FeedbackForm
  ) {
    actionOrderObj["action_submitted_answers"] = inputData?.answers;
    actionOrderObj["action_submitted_comment"] = inputData?.comment;
  } else if (
    action?.type === (await import("../../enums/actionType")).ActionType.SubmitForReview
  ) {
    actionOrderObj["action_submitted_doc_link"] = inputData?.doc_link.trim();
  } else if (
    action?.type === (await import("../../enums/actionType")).ActionType.SocialTwitterVerify &&
        (
          action?.verification_engine === (await import("../../enums/twitterActionType")).TwitterActionType.UserTweet
        )
  ) {
    actionOrderObj["action_tweet_url"] = inputData?.tweet_url.trim();
  } else if (
    action?.type === (await import("../../enums/actionType")).ActionType.HarborAirdrop
  ) {
    actionOrderObj["action_submitted_comdex_address"] = inputData?.comdex_address.trim();
  } else if (
    action?.type === (await import("../../enums/actionType")).ActionType.ConnectCapxWallet
  ) {
    actionOrderObj["action_submitted_capx_address"] = inputData?.wallet_address.trim();
  }

  return actionOrderObj;
}

async function createQuestOrderObj(
    action: any,
    actionId: number,
    questOrder: any,
    actionOrderId: string,
) {
  let questOrderObj: any = {};
  const currentTimestamp: number = Math.ceil(new Date().getTime() / 1000);
  if (Object.keys(questOrder.actions).length === actionId) {
    questOrderObj = await createQuestOrderCompleteObj(action, questOrderObj, actionOrderId, currentTimestamp);
  } else if (actionId === 1) {
    questOrderObj = await createQuestOrderInitialObj(questOrderObj, actionOrderId);
  } else {
    questOrderObj = await createQuestOrderIntermitentObj(questOrderObj, actionOrderId);
  }

  return questOrderObj;
}

async function createQuestOrderCompleteObj(
    action: any,
    questOrderObj: any,
    actionOrderId: string,
    currentTimestamp: number,
) {
  questOrderObj[`actions.${actionOrderId}.action_order_status`] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  questOrderObj[`actions.${actionOrderId}.is_claimed`] = true;
  questOrderObj["status"] = (await import("../../enums/statusType")).StatusType.COMPLETED;
  questOrderObj["quest_end_date"] = currentTimestamp;

  questOrderObj = await addQuestOrderAttributeForActionType(action, questOrderObj);

  return questOrderObj;
}

async function addQuestOrderAttributeForActionType(
    action: any,
    questOrderObj: any,
) {
  if (
    action?.type === (await import("../../enums/actionType")).ActionType.FullName ||
        action?.type === (await import("../../enums/actionType")).ActionType.ProfileImage ||
        action?.type === (await import("../../enums/actionType")).ActionType.LinkTwitter ||
        action?.type === (await import("../../enums/actionType")).ActionType.LinkDiscord ||
        action?.type === (await import("../../enums/actionType")).ActionType.GenerateInviteCode ||
        action?.type === (await import("../../enums/actionType")).ActionType.GenerateOGInviteCode ||
        action?.type === (await import("../../enums/actionType")).ActionType.HarborAirdrop
  ) {
    questOrderObj["status"] = (await import("../../enums/statusType")).StatusType.CLAIMED;
  } else if (
    action?.type !== (await import("../../enums/actionType")).ActionType.SubmitForReview
  ) {
    questOrderObj["claim_allowed"] = true;
  }

  return questOrderObj;
}

async function createQuestOrderInitialObj(
    questOrderObj: any,
    actionOrderId: string,
) {
  questOrderObj[`actions.${actionOrderId}.action_order_status`] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  questOrderObj[`actions.${actionOrderId}.is_claimed`] = true;
  questOrderObj["status"] = (await import("../../enums/statusType")).StatusType.IN_PROGRESS;
  return questOrderObj;
}

async function createQuestOrderIntermitentObj(
    questOrderObj: any,
    actionOrderId: string,
) {
  questOrderObj[`actions.${actionOrderId}.action_order_status`] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  questOrderObj[`actions.${actionOrderId}.is_claimed`] = true;

  return questOrderObj;
}

async function createUserObj(
    increment: number
) {
  const userObj: any = {
    quests_completed: (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };

  return userObj;
}

async function updateQuest(
    batch: WriteBatch,
    questOrder: any,
    actionId: number,
    questOrderId: string
) {
  if (Object.keys(questOrder.actions).length === actionId) {
    // 1. Update Quest Completed Count.
    const orgId: string = questOrderId.split("_")[0];
    const questId: string = questOrderId.split("|")[0];
    batch = await (await import("../updateQuest")).updateQuestCompletedCount(
        orgId,
        batch,
        questId,
        1 // Completed by one.
    );
  }

  return batch;
}

async function updateUser(
    batch: WriteBatch,
    user: any,
    action: any,
    userId: string,
    questOrder: any,
    questOrderId: string,
    actionId: number,
) {
  const userRef = db.collection("xusers").doc(`${userId}`);

  if (Object.keys(questOrder.actions).length === actionId) {
    // 2. Update User Completed.
    const userObj = await createUserObj(1);

    batch.update(userRef, userObj);

    // 3. Update User Agg Document.
    const status = await statusForQuestAggAttributeForActionType(action);
    const userQuestAggObj = await (await import("../updateUser")).createUserAggDocObj(userId, questOrderId, user?.quests_registered, status);
    if (!userQuestAggObj.success) {
      return {
        success: userQuestAggObj.success,
        error: userQuestAggObj.error,
        message: userQuestAggObj.message,
      };
    }

    const userQuestAggRef = userRef.collection("quest-order").doc(`${userQuestAggObj.aggDocId}`);
    batch.update(userQuestAggRef, userQuestAggObj.userQuestAggObj);
  } else if (actionId === 1) {
    // 1. Update User Agg Document.
    const userQuestAggObj = await (await import("../updateUser")).createUserAggDocObj(userId, questOrderId, user?.quests_registered, (await import("../../enums/statusType")).StatusType.IN_PROGRESS);
    if (!userQuestAggObj.success) {
      return {
        success: userQuestAggObj.success,
        error: userQuestAggObj.error,
        message: userQuestAggObj.message,
      };
    }

    const userQuestAggRef = userRef.collection("quest-order").doc(`${userQuestAggObj.aggDocId}`);
    batch.update(userQuestAggRef, userQuestAggObj.userQuestAggObj);
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    batch,
  };
}

async function statusForQuestAggAttributeForActionType(
    action: any
) {
  if (
    action?.type === (await import("../../enums/actionType")).ActionType.FullName ||
        action?.type === (await import("../../enums/actionType")).ActionType.ProfileImage ||
        action?.type === (await import("../../enums/actionType")).ActionType.LinkTwitter ||
        action?.type === (await import("../../enums/actionType")).ActionType.LinkDiscord ||
        action?.type === (await import("../../enums/actionType")).ActionType.GenerateInviteCode ||
        action?.type === (await import("../../enums/actionType")).ActionType.GenerateOGInviteCode ||
        action?.type === (await import("../../enums/actionType")).ActionType.HarborAirdrop
  ) {
    return (await import("../../enums/statusType")).StatusType.CLAIMED;
  }

  return (await import("../../enums/statusType")).StatusType.COMPLETED;
}
