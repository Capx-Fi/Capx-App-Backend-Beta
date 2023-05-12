/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function claimReward(
    token: any,
    data: any
) {
  try {
    // 1. Validate inputs.
    const validRequest = await (await import("../../validators/validateClaimReward")).validateClaimRewardRequest(token, data);
    if (!validRequest.success) {
      return {
        success: validRequest.success,
        error: validRequest.error,
        message: validRequest.message,
      };
    }

    const user: any = validRequest.user;
    const userId: string = validRequest.userId;
    const questOrderId: string = validRequest.questOrderId;
    const rewardAmt = Number(validRequest.rewardAmt);
    const userQuestCount = Number(validRequest.userQuestCount);
    const inviterId: string = validRequest.inviterId;
    const inviterCode: string = validRequest.inviterCode;
    const claimInviterFlag: boolean = validRequest.claimInviterRewardFlag;
    const rewardType: string = validRequest.rewardType;

    const orgId: string = questOrderId.split("_")[0];
    const questId: string = questOrderId.split("|")[0];

    // Batch Write.
    let batch = db.batch();

    // 2. Update Quest Order.
    const questOrderObj: any = {
      points_rewarded: (await import("firebase-admin/firestore")).FieldValue.increment(rewardAmt),
      status: (await import("../../enums/statusType")).StatusType.CLAIMED,
    };

    const questOrderRef = db.collection("xquest_order").doc(questOrderId);
    batch.update(questOrderRef, questOrderObj);

    // 3. Update User Collection.
    const userObj: any = await createUserRewardsObj(user, rewardAmt, rewardType);

    const userRef = db.collection("xusers").doc(userId);
    batch.update(userRef, userObj);

    // 4. Update User Quest Order Aggregate Document.
    const userQuestAggObj = await (await import("../updateUser")).createUserAggDocObj(
        userId,
        questOrderId,
        userQuestCount,
        (await import("../../enums/statusType")).StatusType.CLAIMED
    );
    if (!userQuestAggObj.success) {
      return {
        success: userQuestAggObj.success,
        error: userQuestAggObj.error,
        message: userQuestAggObj.message,
      };
    }

    const userQuestAggRef = userRef.collection("quest-order").doc(`${userQuestAggObj.aggDocId}`);
    batch.update(userQuestAggRef, userQuestAggObj.userQuestAggObj);

    // 5. Update Quest Claimed Rewards.
    const questObj: any = await (await import("../updateQuest")).updateQuestClaimedRewards(Number(rewardAmt));

    const questRef = db.collection("xorgs").doc(`${orgId}`).collection("quests").doc(`${questId}`);
    batch.update(questRef, questObj);

    if (claimInviterFlag) {
      // 6. Update claimInviterRewards.
      const claimInviterRewards = await (await import("../claimRewards/claimInviterReward")).claimInviterReward(
          batch,
          userId,
          inviterId,
          inviterCode
      );
      if (!claimInviterRewards.success) {
        return {
          success: claimInviterRewards.success,
          error: claimInviterRewards.error,
          message: claimInviterRewards.message,
        };
      }

      batch = claimInviterRewards.batch;
    }

    try {
      const commitResult = await batch.commit();
      if (commitResult) {
        return {
          success: true,
          message: "SUCCESS: Rewards Claimed Successfully!",
          error: "NONE",
        };
      }
      return {
        success: false,
        message: "Error Processing Request",
        error: "Something went wrong: Batch Commit Failed.",
      };
    } catch (err) {
      functions.logger.error(`Something Wrong happened: Batch Commit\nError Details: \t${err}`);
      return {
        success: false,
        message: "ERROR",
        error: `Something Wrong happened: Batch Commit \nError Details: \t${err}`,
      };
    }
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: \nError Details: \t${err}`,
    };
  }
}


async function createUserRewardsObj(
    user: any,
    reward: any,
    rewardType: string,
) {
  let userObj: any = {};
  if (rewardType === (await import("../../enums/rewardType")).RewardType.CMDX) {
    userObj = await (await import("../updateUser")).updateCMDXTypeEarnedReward(user, Number(reward));
  } else {
    userObj = {
      earned_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(reward),
    };
  }

  return userObj;
}
