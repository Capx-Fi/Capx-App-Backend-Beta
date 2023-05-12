/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function completeQuest(
    batch: WriteBatch,
    user: any,
    action: any,
    questOrder: any,
    actionOrder: any,
    userId: string,
    questOrderId: string,
    actionOrderId: string,
    streak: number
) {
  if (action?.type !== (await import("../../enums/actionType")).ActionType.DailyReward) {
    return {
      success: false,
      error: `Invalid Action type. Provided Action Type: ${action?.type}`,
      message: "ERROR: Invalid Action type",
      batch,
    };
  }

  try {
    const currentTimestamp = Number(Math.floor(Math.ceil(new Date().getTime() / 1000) / 86400) * 86400);

    // 1. Update Quest Order Document.
    const getQuestObj = await createQuestOrderUpdateObj(
        streak,
        action,
        questOrder,
        actionOrderId,
        currentTimestamp
    );
    if (!getQuestObj.success) {
      return {
        success: getQuestObj.success,
        error: getQuestObj.error,
        message: getQuestObj.message,
      };
    }
    const questOrderRef = db.collection("xquest_order").doc(`${questOrderId}`);
    batch.update(questOrderRef, getQuestObj.questOrderObj);


    // 2. Update Action Order Document.
    const actionOrderObj = await createActionOrderUpdateObj(
        streak,
        actionOrder,
        currentTimestamp
    );

    const actionOrderRef = questOrderRef.collection("action_order").doc(`${actionOrderId}`);
    batch.update(actionOrderRef, actionOrderObj);

    const rewardAmt = Number(getQuestObj.rewardAmount);
    const nextRewardAmt = Number(getQuestObj.nextReward);
    const nextRewardStreak = Number(getQuestObj.nextStreak);

    // 3. Update User to increment Rewards.
    const userRewardObj = await createUserRewardObj(rewardAmt);

    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userRewardObj);

    // 4. Update User -> Quest Order Aggregate Document.
    const userQuestAggObj = await (await import("../updateUser")).createUserAggDocObj(
        userId,
        questOrderId,
        Number(user?.quests_registered),
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

    const userQuestAggRef = userRef.collection("quest-order").doc(`${userQuestAggObj.aggDocId}`);
    batch.update(userQuestAggRef, userQuestAggObj.userQuestAggObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch: batch,
      rewardAmt,
      nextRewardAmt,
      nextRewardStreak,
    };
  } catch (err) {
    functions.logger.error("Error:\n", err);
    return {
      success: false,
      message: "Something Broken:",
      error: `Something Broken: \nError Details: ${err}`,
      batch,
    };
  }
}

async function createActionOrderUpdateObj(
    streak: number,
    actionOrder: any,
    currentTimestamp: number,
) {
  const actionOrderObj: any = {
    action_order_status: (await import("../../enums/orderStatus")).OrderStatus.COMPLETED,
    last_claimed_at: currentTimestamp,
    is_claimed: true,
    streak: Number(streak),
  };

  // Check the last streak and if streak broken, update the last streak at which it was broken.
  const lastStreak = Number(actionOrder?.streak);
  const lastStreakTimestamp = Number(actionOrder?.last_claimed_at);

  if (lastStreakTimestamp > 0 && currentTimestamp - lastStreakTimestamp > 86400) {
    actionOrderObj["last_streak_broken"] = lastStreak;
    actionOrderObj["last_streak_broken_timestamp"] = lastStreakTimestamp;
  }

  return actionOrderObj;
}

async function createQuestOrderUpdateObj(
    streak: number,
    action: any,
    questOrder: any,
    actionOrderId: string,
    currentTimestamp: number,
) {
  let questOrderObj: any = {};
  let rewardAmount = Number(action?.reward_amount);

  // 1. Determine the reward amount.
  const getAmt = await getRewardAmount(streak, questOrder, rewardAmount, questOrderObj, currentTimestamp);
  if (!getAmt.success) {
    return {
      success: getAmt.success,
      error: getAmt.error,
      message: getAmt.message,
    };
  }

  // 2. Determine next reward status.
  const nextReward = getNextRewardStreakAmt(streak).nextReward;
  const nextStreak = getNextRewardStreakAmt(streak).nextStreak;

  questOrderObj = getAmt.questOrderObj;
  rewardAmount = Number(getAmt.rewardAmount);

  questOrderObj = addStreakCounter(streak, currentTimestamp, questOrder, questOrderObj);

  questOrderObj[`actions.${actionOrderId}.action_order_status`] = (await import("../../enums/orderStatus")).OrderStatus.COMPLETED;
  questOrderObj[`actions.${actionOrderId}.is_claimed`] = true;
  questOrderObj["points_rewarded"] = (await import("firebase-admin/firestore")).FieldValue.increment(rewardAmount);
  questOrderObj["status"] = (await import("../../enums/statusType")).StatusType.CLAIMED;

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    questOrderObj,
    rewardAmount,
    nextReward,
    nextStreak,
  };
}

async function getRewardAmount(
    streak: number,
    questOrder: any,
    rewardAmount: number,
    questOrderObj: any,
    currentTimestamp: number,
) {
  try {
    let newRewardAmount = Number(rewardAmount);
    switch (streak) {
      case 7: {
        newRewardAmount = 2;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 14: {
        newRewardAmount = 3;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 21: {
        newRewardAmount = 4;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 28: {
        newRewardAmount = 5;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 35: {
        newRewardAmount = 6;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 42: {
        newRewardAmount = 7;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 100: {
        newRewardAmount = 20;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 200: {
        newRewardAmount = 30;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      case 365: {
        newRewardAmount = 50;
        if (questOrder["streaks"] !== undefined) {
          questOrderObj[`streaks.${streak}.last_claimed_at`] = currentTimestamp;
          questOrderObj[`streaks.${streak}.claim_counts`] = (await import("firebase-admin/firestore")).FieldValue.increment(1);
        }
        break;
      }
      default: {
        break;
      }
    }

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      rewardAmount: newRewardAmount,
      questOrderObj: questOrderObj,
    };
  } catch (err) {
    functions.logger.error("Error:\n", err);
    return {
      success: false,
      error: `Something Broken while calculating Reward Amount: \nError Details: ${err}`,
      message: "Unable to Process Request.",
    };
  }
}

function addStreakCounter(
    streak: number,
    currentTimestamp: number,
    questOrder: any,
    questOrderObj: any
) {
  if (questOrder["streaks"] === undefined) {
    questOrderObj["streaks"] = {
      "7": {
        "last_claimed_at": streak === 7 ? currentTimestamp: Number(0),
        "claim_counts": streak === 7 ? Number(1) : Number(0),
      },
      "14": {
        "last_claimed_at": streak === 14 ? currentTimestamp: Number(0),
        "claim_counts": streak === 14 ? Number(1) : Number(0),
      },
      "21": {
        "last_claimed_at": streak === 21 ? currentTimestamp: Number(0),
        "claim_counts": streak === 21 ? Number(1) : Number(0),
      },
      "28": {
        "last_claimed_at": streak === 28 ? currentTimestamp: Number(0),
        "claim_counts": streak === 28 ? Number(1) : Number(0),
      },
      "35": {
        "last_claimed_at": streak === 35 ? currentTimestamp: Number(0),
        "claim_counts": streak === 35 ? Number(1) : Number(0),
      },
      "42": {
        "last_claimed_at": streak === 42 ? currentTimestamp: Number(0),
        "claim_counts": streak === 42 ? Number(1) : Number(0),
      },
      "100": {
        "last_claimed_at": streak === 100 ? currentTimestamp: Number(0),
        "claim_counts": streak === 100 ? Number(1) : Number(0),
      },
      "200": {
        "last_claimed_at": streak === 200 ? currentTimestamp: Number(0),
        "claim_counts": streak === 200 ? Number(1) : Number(0),
      },
      "365": {
        "last_claimed_at": streak === 365 ? currentTimestamp: Number(0),
        "claim_counts": streak === 365 ? Number(1) : Number(0),
      },
    };
  }

  return questOrderObj;
}

function getNextRewardStreakAmt(
    streak: number
) {
  if (streak < 7) {
    return {
      nextStreak: 7,
      nextReward: 2,
    };
  } else if (streak < 14) {
    return {
      nextStreak: 14,
      nextReward: 3,
    };
  } else if (streak < 21) {
    return {
      nextStreak: 21,
      nextReward: 4,
    };
  } else if (streak < 28) {
    return {
      nextStreak: 28,
      nextReward: 5,
    };
  } else if (streak < 35) {
    return {
      nextStreak: 35,
      nextReward: 6,
    };
  } else if (streak < 42) {
    return {
      nextStreak: 42,
      nextReward: 7,
    };
  } else if (streak < 100) {
    return {
      nextStreak: 100,
      nextReward: 20,
    };
  } else if (streak < 200) {
    return {
      nextStreak: 200,
      nextReward: 30,
    };
  } else if (streak < 365) {
    return {
      nextStreak: 365,
      nextReward: 50,
    };
  } else {
    return {
      nextStreak: 730,
      nextReward: 100,
    };
  }
}

export async function createUserRewardObj(
    rewardAmount: number
) {
  const userObj: any = {
    earned_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(rewardAmount),
  };

  return userObj;
}
