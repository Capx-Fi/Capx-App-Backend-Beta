/* eslint-disable max-len */
import {db} from "../../init/init";

export async function getRewardPool(
    token: any,
    inputData: any
) {
  // 1. Validate Request.
  if (!token?.uid) {
    return {
      success: false,
      message: "ERROR: Invalid Token",
      error: "Missing `uid` in token.",
    };
  }

  // 2. Check provided questId.
  const questOrderId: string = inputData?.questOrderId;
  if (questOrderId.trim() === "") {
    return {
      success: false,
      message: "ERROR: Invalid value for `questOrderId`",
      error: `Invalid value for questOrderId ${questOrderId}`,
    };
  }
  const orgId: string = questOrderId.split("_")[0];
  const questId: string = questOrderId.split("|")[0];

  // 3. Read Document.
  const quest = await db.collection("xorgs").doc(`${orgId}`).collection("quests").doc(`${questId}`).get();
  if (!quest.exists) {
    return {
      success: false,
      message: "ERROR: Invalid value for `questOrderId`",
      error: `Quest Doesn't exist ${questId}`,
    };
  }

  const questData: any = quest.data();
  const claimedRewards = Number(questData?.claimed_rewards);
  const totalRewards = Number(questData?.total_rewards);

  return {
    success: true,
    message: "SUCCESS",
    error: "NONE",
    rewardPool: {
      claimedRewards: claimedRewards,
      totalRewards: totalRewards,
    },
  };
}
