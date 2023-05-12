/* eslint-disable max-len */
import {db} from "../init/init";

export async function validateClaimRewardRequest(
    token: any,
    data: any
) {
  // 1. Validate Token Object.
  const questOrderId: string = data?.quest_order_id.trim();
  const isValidToken = validateTokenObject(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  // 2. Validate if user is authorized.
  const userId: string = questOrderId.split("|")[1];
  const isAuthorizedUser = validateIfAuthorizedUser(token?.uid, userId);
  if (!isAuthorizedUser.success) {
    return {
      success: isAuthorizedUser.success,
      error: isAuthorizedUser.error,
      message: isAuthorizedUser.message,
    };
  }
  // 3. Retrieve Docs (if any).
  const docs = await retrieveDocs(userId, questOrderId);
  if (!docs.success) {
    return {
      success: docs.success,
      error: docs.error,
      message: docs.message,
    };
  }
  // 4. Validate User.
  const user: any = docs.retrievedDocs[`${userId}`];
  const validUser = validateUser(user);
  if (!validUser.success) {
    return {
      success: validUser.success,
      error: validUser.error,
      message: validUser.message,
    };
  }
  // 5. Validate Quest Order.
  const questOrder: any = docs.retrievedDocs[`${questOrderId}`];
  const validQuestOrder = await validateQuestOrder(questOrder);
  if (!validQuestOrder.success) {
    return {
      success: validQuestOrder.success,
      error: validQuestOrder.error,
      message: validQuestOrder.message,
    };
  }

  // 6. Validate Quest.
  const quest: any = docs.retrievedDocs[`${docs.questId}`];
  const isValidQuest = await validateQuest(user.data, quest, Number(questOrder.data?.max_rewards));
  if (!isValidQuest.success) {
    return {
      success: isValidQuest.success,
      error: isValidQuest.error,
      message: isValidQuest.message,
    };
  }

  const claimInviterRewardFlag = await setClaimInviterRewardFlag(user?.data, questOrder?.data);

  return {
    success: true,
    message: "NONE",
    error: "NONE",
    user: user.data,
    userId: userId,
    rewardAmt: questOrder.data?.max_rewards,
    questOrderId: questOrderId,
    userQuestCount: user.data?.quests_registered,
    rewardType: questOrder.data?.rewards_type,
    inviterId: user.data?.inviter_id,
    inviterCode: user.data?.inviter_code,
    claimInviterRewardFlag: claimInviterRewardFlag,
  };
}

function validateTokenObject(
    token: any
) {
  if (!token?.uid) {
    return {success: false, message: "ERROR: Invalid Token", error: `Invalid Token. \nToken Details: ${token}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function setClaimInviterRewardFlag(
    userData: any,
    questOrderData: any
) {
  // Only IOU Reward Type.
  if (questOrderData?.rewards_type === (await import("../enums/rewardType")).RewardType.CMDX) {
    return false;
  }

  if (userData?.earned_rewards + questOrderData?.max_rewards >= 10) {
    return true;
  }
  return false;
}

function validateIfAuthorizedUser(
    tokenUserId: string,
    questUserId: string,
) {
  if (questUserId !== tokenUserId) {
    return {success: false, message: "ERROR: Invalid Request", error: `Trying to complete different Users quest. ${tokenUserId} for ${questUserId}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function retrieveDocs(
    userId: string,
    questOrderId: string
) {
  const docsRetrieval: any[] = [];
  const retrievedDocs : any = {};

  const orgId: string = questOrderId.split("_")[0];
  const questId: string = questOrderId.split("|")[0];

  try {
    // 1. User Document.
    const user = db.collection("xusers").doc(`${userId}`);
    docsRetrieval.push(user);

    // 2. Quest Order.
    const questOrder = db.collection("xquest_order").doc(`${questOrderId}`);
    docsRetrieval.push(questOrder);

    // 3. Quest Document.
    const quest = db.collection("xorgs").doc(`${orgId}`).collection("quests").doc(`${questId}`);
    docsRetrieval.push(quest);
  } catch (err) {
    return {
      success: false,
      error: `Document Retrieval Object Failed!. ${err}`,
      message: "Document Retrieval Object Failed!",
    };
  }

  try {
    const docs = await db.getAll(...docsRetrieval);
    for (let i = 0; i < docs.length; i++) {
      retrievedDocs[docs[i].id] = {
        id: docs[i].id,
        exists: docs[i].exists,
        data: docs[i].data(),
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Document Retrieval Failed!. ${err}`,
      message: "Document Retrieval Failed!",
    };
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    retrievedDocs,
    questId: questId,
  };
}

function validateUser(
    userDoc: any
) {
  if (!userDoc.exists) {
    return {
      success: false,
      error: "User Doesn't Exist.",
      message: "Invalid UserId",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrder(
    questDoc: any
) {
  if (!questDoc.exists) {
    return {
      success: false,
      error: "Quest Doesn't Exist.",
      message: "Invalid QuestId",
    };
  }
  // Validate Quest Status.
  const validQuest = await validateQuestOrderStatus(questDoc.data);
  if (!validQuest.success) {
    return {
      success: validQuest.success,
      error: validQuest.error,
      message: validQuest.message,
    };
  }

  // Validate Quest Rewards.
  const validQuestRewards = await validateQuestOrderReward(questDoc.data);
  if (!validQuestRewards.success) {
    return {
      success: validQuestRewards.success,
      error: validQuestRewards.error,
      message: validQuestRewards.message,
    };
  }

  // Validate Quest Category Type.
  const validQuestCategory = await validateQuestOrderCategoryType(questDoc.data);
  if (!validQuestCategory.success) {
    return {
      success: validQuestCategory.success,
      error: validQuestCategory.error,
      message: validQuestCategory.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrderStatus(
    questData: any
) {
  if (questData?.status !== (await import("../enums/statusType")).StatusType.COMPLETED) {
    return {
      success: false,
      error: "Quest NOT Completed.",
      message: "ERROR: Quest NOT completed.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrderReward(
    questData: any
) {
  if (Number(questData?.points_rewarded) + Number(questData?.max_rewards) > Number(questData?.max_rewards)) {
    return {
      success: false,
      message: "ERROR: Unable to Claim!",
      error: "Something wrong. Points_rewarded + reward_amount > max_rewards",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrderCategoryType(
    questData: any
) {
  if (questData.quest_category === (await import("../enums/questCategoryType")).QuestCategoryType.SubmitArticle) {
    return validateQuestOrderCategoryTypeSubmitArticle(questData);
  }
  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrderCategoryTypeSubmitArticle(
    questData: any
) {
  if (!questData?.claim_allowed) {
    return {
      success: false,
      message: "ERROR: Unable to Claim!",
      error: "User is NOT allowed to claim.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuest(
    user: any,
    quest: any,
    userReward: number
) {
  if (!quest.exists) {
    return {
      success: false,
      error: "Quest Doesn't Exist.",
      message: "Invalid QuestId",
    };
  }

  // Eligibility Check.
  const isEligible = await checkEligibility(user, quest.data);
  if (!isEligible.success) {
    return {
      success: isEligible.success,
      error: isEligible.error,
      message: isEligible.message,
    };
  }

  // Check If rewards claimable.
  const isRewardClaimable = await checkRewardClaimable(quest.data, userReward);
  if (!isRewardClaimable.success) {
    return {
      success: isRewardClaimable.success,
      error: isRewardClaimable.error,
      message: isRewardClaimable.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function checkRewardClaimable(
    questData: any,
    userReward: number,
) {
  const totalRewards = Number(questData?.total_rewards);
  const claimedRewards = Number(questData?.claimed_rewards);

  if (totalRewards < 0) {
    return {
      success: true,
      error: "NONE",
      message: "No Upper Bound SET.",
    };
  }

  if (claimedRewards + userReward > totalRewards) {
    return {
      success: false,
      error: "All rewards are claimed.",
      message: "ERROR: NO Reward to claim.",
    };
  }
  return {
    success: true,
    error: "NONE",
    message: "NONE",
  };
}

async function checkEligibility(
    userData: any,
    questData: any
) {
  const eligibility: any = questData?.eligibility;
  if (!eligibility.enabled) {
    return {
      success: true,
      error: "NONE",
      message: "Eligibility Disabled",
    };
  }

  // Check for various scenarios.
  const eligibilityCriteria = eligibility.criteria;
  const criteria = Object.keys(eligibilityCriteria);

  for (let i = 0; i < criteria.length; i++) {
    if (eligibilityCriteria[`${criteria[i]}`]) {
      const response = await handleCriteria(criteria[i], userData);
      if (!response.success) {
        return {
          success: response.success,
          error: response.error,
          message: response.message,
        };
      }
    }
  }
  return {success: true, error: "NONE", message: "NONE"};
}


async function handleCriteria(
    criteriaType: string,
    userData: any
) {
  if (criteriaType === (await import("../enums/eligibilityCriteriaType")).EligibilityCriteriaType.TwitterConnected) {
    const response = checkIfUserTwitterConnected(userData);
    if (!response.success) {
      return {
        success: response.success,
        error: response.error,
        message: response.message,
      };
    }
  } else if (criteriaType === (await import("../enums/eligibilityCriteriaType")).EligibilityCriteriaType.DiscordConnected) {
    const response = checkIfUserDiscordConnected(userData);
    if (!response.success) {
      return {
        success: response.success,
        error: response.error,
        message: response.message,
      };
    }
  }
  return {success: true, error: "NONE", message: "NONE"};
}

function checkIfUserTwitterConnected(
    userData: any
) {
  if (userData?.socials["twitter_id"] === "") {
    return {
      success: false,
      error: "Eligibility FAILED: User Twitter NOT Connected.",
      message: "Not Eligible to Claim Reward",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function checkIfUserDiscordConnected(
    userData: any
) {
  if (userData?.socials["discord_id"] === "") {
    return {
      success: false,
      error: "Eligibility FAILED: User Discord NOT Connected.",
      message: "Not Eligible to Claim Reward",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}
