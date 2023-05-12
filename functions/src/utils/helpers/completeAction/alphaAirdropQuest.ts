/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function completeQuest(
    batch: WriteBatch,
    user: any,
    action: any,
    questOrder: any,
    userId: string,
    actionOrderId: string,
    questOrderId: string
) {
  if (action?.type !== (await import("../../enums/actionType")).ActionType.AlphaAirDrop) {
    return {
      success: false,
      error: `Invalid Action type. Provided Action Type: ${action?.type}`,
      message: "ERROR: Invalid Action type",
      batch,
    };
  }

  try {
    // 1. Create Action Object for Completion.
    const actionOrderObj = await createActionOrderObj();
    const actionOrderRef = db.collection("xquest_order").doc(`${questOrderId}`).collection("action_order").doc(`${actionOrderId}`);

    batch.update(actionOrderRef, actionOrderObj);

    // 2. Create Quest Object for Completion.
    const questOrderObj = await createQuestOrderObj(
        actionOrderId,
        Number(questOrder?.max_rewards)
    );
    const questOrderRef = db.collection("xquest_order").doc(`${questOrderId}`);

    batch.update(questOrderRef, questOrderObj);

    // 3 Update Quest Completed Count.
    const orgId: string = questOrderId.split("_")[0];
    const questId: string = questOrderId.split("|")[0];
    batch = await (await import("../updateQuest")).updateQuestCompletedCount(
        orgId,
        batch,
        questId,
        1 // Completed by one.
    );

    // 4. Update user to increment `earned_rewards`
    const userObj = await createUserRewardsObj(Number(questOrder?.max_rewards));
    const userRef = db.collection("xusers").doc(userId);

    batch.update(userRef, userObj);

    // 5. Update user -> Quest Order agg document.
    const userQuestAggObj = await (await import("../updateUser")).createUserAggDocObj(
        userId,
        questOrderId,
        user?.quests_registered,
        (await import("../../enums/statusType")).StatusType.CLAIMED
    );
    if (!userQuestAggObj.success) {
      return {
        success: userQuestAggObj.success,
        error: userQuestAggObj.error,
        message: userQuestAggObj.message,
        batch,
      };
    }

    const userQuestAggRef = db.collection("xusers").doc(userId).collection("quest-order").doc(`${userQuestAggObj.aggDocId}`);
    batch.update(userQuestAggRef, userQuestAggObj.userQuestAggObj);

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

async function createActionOrderObj() {
  const actionObj: any = {
    action_order_status: (await import("../../enums/orderStatus")).OrderStatus.COMPLETED,
    is_claimed: true,
  };

  return actionObj;
}

async function createQuestOrderObj(
    actionOrderId: string,
    rewardAmount: number
) {
  const questOrderObj: any = {};
  questOrderObj[`actions.${actionOrderId}.action_order_status`] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  questOrderObj[`actions.${actionOrderId}.is_claimed`] = true;
  questOrderObj["points_rewarded"] = (await import("firebase-admin/firestore")).FieldValue.increment(rewardAmount);
  questOrderObj["status"] = (await import("../../enums/statusType")).StatusType.CLAIMED;
  questOrderObj["quest_end_date"] = Math.ceil(new Date().getTime() / 1000);

  return questOrderObj;
}

async function createUserRewardsObj(
    rewardAmount: number
) {
  const userObj: any = {
    earned_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(rewardAmount),
    quests_completed: (await import("firebase-admin/firestore")).FieldValue.increment(1),
  };

  return userObj;
}
