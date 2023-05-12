/* eslint-disable max-len */
import {db} from "../../init/init";

export async function getActionOrderObject(
    orgId: string,
    userId: string,
    questId: string,
    questOrderId: string,
    questActionsIds: string[],
) {
  // 1. Retrieve Action Documents.
  console.log("ActionIds", questActionsIds);
  const docs = await retrieveActionDocs(orgId, questId, questActionsIds);
  if (!docs.success) {
    return {
      success: docs.success,
      error: docs.error,
      message: docs.message,
    };
  }

  // 2. Create Action Order Objects
  const createActionObj = await createActionOrderObject(
      orgId,
      userId,
      questOrderId,
      questActionsIds,
      docs.retrievedDocs
  );
  if (!createActionObj.success) {
    return {
      success: createActionObj.success,
      error: createActionObj.error,
      message: createActionObj.message,
    };
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    actionObjs: createActionObj.actionOrders,
  };
}

async function retrieveActionDocs(
    orgId: string,
    questId: string,
    actionIds: string[]
) {
  const referenceDocs: any = [];
  for (let i = 0; i < actionIds.length; i++) {
    const actionRecord = db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("actions").doc(`${actionIds[i]}`);
    referenceDocs.push(actionRecord);
  }

  const _retrievedDocs : any = {};
  try {
    const docs = await db.getAll(...referenceDocs);
    for (let i = 0; i < docs.length; i++) {
      _retrievedDocs[docs[i].id] = {
        id: docs[i].id,
        exists: docs[i].exists,
        data: docs[i].data(),
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Action Document Retrieval Failed!. ${err}`,
      message: "Action Document Retrieval Failed!",
    };
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    retrievedDocs: _retrievedDocs,
  };
}

async function createActionOrderObject(
    orgId: string,
    userId: string,
    questOrderId: string,
    actionIds: string[],
    actionDocs: any
) {
  try {
    const actionOrders: any = [];
    for (let i = 1; i <= actionIds.length; i++) {
      const actionRecord: any = actionDocs[`${i}`].data;
      const actionOrderId = questOrderId + "-" + actionIds[i-1];
      let actionObj: any = {
        docType: "Individual",
        org_id: orgId,
        quest_order_id: questOrderId,
        action_id: Number(actionIds[i-1]),
        action_order_title: actionRecord?.title,
        action_order_type: actionRecord?.type,
        action_order_cta: actionRecord?.cta_title,
        action_order_left_title: actionRecord?.left_title,
        action_tag: actionRecord?.action_tag,
        user_id: userId,
        action_order_status: (await import("../../enums/orderStatus")).OrderStatus.PENDING,
        action_order_id: actionOrderId,
        is_claimed: false,
        action_order_subtype: actionRecord?.verification_engine ? actionRecord?.verification_engine : "",
      };

      const handleAction = await handleActionType(actionObj, actionRecord);
      if (!handleAction.success) {
        return {
          success: handleAction.success,
          error: handleAction.error,
          message: handleAction.message,
        };
      }

      actionObj = handleAction.actionOrderObj;
      actionOrders.push({
        actionOrderId,
        actionOrderObj: actionObj,
      });
    }

    return {
      success: true,
      error: "NONE",
      message: "NONE",
      actionOrders: actionOrders,
    };
  } catch (err) {
    return {
      success: false,
      error: `Action Order creation failed. ${err}`,
      message: "Action Order creation failed!",
    };
  }
}

async function handleActionType(
    actionOrderObj: any,
    actionRecord: any,
) {
  try {
    if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.DailyReward) {
      actionOrderObj = handleDailyRewardType(actionOrderObj);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.Quiz) {
      actionOrderObj = handleQuizType(actionOrderObj, actionRecord);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.FeedbackForm) {
      actionOrderObj = handleFeedbackFormType(actionOrderObj, actionRecord);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.Video) {
      actionOrderObj = handleVideoType(actionOrderObj, actionRecord);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.Blog) {
      actionOrderObj = handleBlogType(actionOrderObj, actionRecord);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.Info) {
      actionOrderObj = handleInfoType(actionOrderObj, actionRecord);
    } else if (actionRecord?.type === (await import("../../enums/actionType")).ActionType.ShareInviteCode) {
      actionOrderObj = handleShareInviteCodeType(actionOrderObj, actionRecord);
    } else if ( actionRecord?.type === (await import("../../enums/actionType")).ActionType.SocialTwitterVerify) {
      actionOrderObj = await handleSocialTwitterVerifyType(actionOrderObj, actionRecord);
    } else if ( actionRecord?.type === (await import("../../enums/actionType")).ActionType.VerifyOnChain) {
      actionOrderObj = handleVerifyOnChainType(actionOrderObj, actionRecord);
    } else {
      actionOrderObj = handleDefaultActionType(actionOrderObj);
    }

    return {
      success: true,
      error: "NONE",
      message: "NONE",
      actionOrderObj: actionOrderObj,
    };
  } catch (err) {
    return {
      success: false,
      error: `Action Order object creation failed. ${err}`,
      message: "Action Order object creation failed!",
    };
  }
}

function handleDefaultActionType(
    actionOrderObj: any
) {
  return actionOrderObj;
}

function handleVerifyOnChainType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_info"] = actionRecord?.action_info;
  actionOrderObj["action_order_info"]["type"] = actionRecord?.verification_engine;
  actionOrderObj["action_order_info"]["req_quest_id"] = "f7ILwJaAwQ+2n4D8euNpQ0lVuFJJAYLvw9O2niisDZM=_10";
  return actionOrderObj;
}

async function handleSocialTwitterVerifyType(
    actionOrderObj: any,
    actionRecord: any
) {
  if (actionRecord?.verification_engine === (await import("../../enums/twitterActionType")).TwitterActionType.UserFollows) {
    actionOrderObj = handleSocialTwitterVerifyTypeUserFollows(actionOrderObj, actionRecord);
  } else if (actionRecord?.verification_engine === (await import("../../enums/twitterActionType")).TwitterActionType.UserTweet) {
    actionOrderObj = handleSocialTwitterVerifyTypeUserTweet(actionOrderObj, actionRecord);
  } else if (actionRecord?.verification_engine === (await import("../../enums/twitterActionType")).TwitterActionType.TwitterInfo) {
    actionOrderObj = handleSocialTwitterVerifyTypeTwitterInfo(actionOrderObj, actionRecord);
  } else {
    actionOrderObj["action_order_details"] = {
      tweet_url: actionRecord?.tweet_url,
    };
  }

  return actionOrderObj;
}

function handleSocialTwitterVerifyTypeUserFollows(
    actionOrderObj: any,
    actionRecord: any
) {
  actionOrderObj["action_order_details"] = {
    twitter_account_url: `https://twitter.com/${actionRecord?.twitter_id_username}`,
  };

  return actionOrderObj;
}

function handleSocialTwitterVerifyTypeUserTweet(
    actionOrderObj: any,
    actionRecord: any
) {
  actionOrderObj["action_order_details"] = {
    tweet_strings: actionRecord?.tweet_strings,
  };

  return actionOrderObj;
}

function handleSocialTwitterVerifyTypeTwitterInfo(
    actionOrderObj: any,
    actionRecord: any
) {
  actionOrderObj["action_order_details"] = actionRecord?.info_details;

  return actionOrderObj;
}

function handleShareInviteCodeType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = {
    social_platforms: actionRecord?.sharing_platforms,
  };

  return actionOrderObj;
}

function handleInfoType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = actionRecord?.details;

  return actionOrderObj;
}

function handleBlogType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = {
    media_link: actionRecord.media_link,
  };

  return actionOrderObj;
}

function handleVideoType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = {
    media_link: actionRecord.media_link,
  };

  return actionOrderObj;
}

function handleFeedbackFormType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = {
    questions: actionRecord.questions,
    options: actionRecord.options,
  };

  return actionOrderObj;
}

function handleQuizType(
    actionOrderObj: any,
    actionRecord: any,
) {
  actionOrderObj["action_order_details"] = {
    question: actionRecord.question,
    options: actionRecord.options,
  };

  return actionOrderObj;
}

function handleDailyRewardType(
    actionOrderObj: any,
) {
  actionOrderObj["last_claimed_at"] = Number(0);
  actionOrderObj["streak"] = Number(0);

  return actionOrderObj;
}
