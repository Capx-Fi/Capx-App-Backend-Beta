/* eslint-disable max-len */

export async function createQuestOrderObject(
    quest: any,
    orgId: string,
    userId: string,
    username: string,
    questId: string,
    questOrderId: string,
) {
  try {
    // Get Action objects for the Quest.
    const questActionObj = await createQuestActionObject(quest, questOrderId);
    if (!questActionObj.success) {
      return {
        success: questActionObj.success,
        error: questActionObj.error,
        message: questActionObj.message,
      };
    }

    // Create Quest Object.
    const questOrderObj: any = await createQuestObject(
        orgId,
        userId,
        quest,
        questId,
        username,
        questOrderId,
        questActionObj?.questActionObj
    );

    return {
      success: true,
      error: "NONE",
      message: "NONE",
      questOrderObj: questOrderObj,
      questActionIds: questActionObj.questActionIds,
    };
  } catch (err) {
    return {
      success: false,
      error: "Quest Object Creation Failed.",
      message: "Quest Registration Failed.",
    };
  }
}

async function createQuestObject(
    orgId: string,
    userId: string,
    quest: any,
    questId: string,
    username: string,
    questOrderId: string,
    questActionObj: any
) {
  let questOrderObj: any = {
    docType: "Individual",
    org_id: orgId,
    quest_id: questId,
    quest_order_id: questOrderId,
    quest_type: quest?.quest_type,
    quest_category: quest?.quest_category,
    quest_title: quest?.title,
    quest_start_date: Math.ceil(new Date().getTime() / 1000),
    quest_end_date: "",
    quest_description: quest?.description,
    rewards_type: quest?.rewards_type,
    max_rewards: Number(quest?.max_rewards),
    points_rewarded: Number(0),
    user_id: userId,
    status: (await import("../../enums/statusType")).StatusType.REGISTERED,
    actions: questActionObj,
    claim_allowed: false,
  };

  questOrderObj = await handleQuestType(quest, username, questOrderObj);
  return questOrderObj;
}

async function handleQuestType(
    quest: any,
    username: string,
    questOrderObj : any
) {
  if (quest?.quest_category === (await import("../../enums/questCategoryType")).QuestCategoryType.AlphaAirDrop) {
    questOrderObj = handleQuestCategoryAlphaAirDrop(quest, username, questOrderObj);
  }
  return questOrderObj;
}

function handleQuestCategoryAlphaAirDrop(
    quest: any,
    username: string,
    questOrderObj: any
) {
  const rewardAmount = Number(quest?.allowed_users_reward[`${username}`]);
  questOrderObj["max_rewards"] = rewardAmount;
  return questOrderObj;
}

async function createQuestActionObject(
    quest: any,
    questOrderId: string,
) {
  const questActionObj: any = {};
  const questActionIds: string[] = [];
  try {
    const actions: any = quest?.actions;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionId: string = action.action_id;
      questActionIds.push(actionId);
      const actionOrderId = questOrderId + "-" + actionId.toString();
      questActionObj[actionOrderId] = {
        action_title: action.title,
        action_order_type: action.type,
        action_order_status: (await import("../../enums/orderStatus")).OrderStatus.PENDING,
        action_id: action.action_id,
        action_order_id: actionOrderId,
        action_order_left_title: action.left_title,
        action_tag: action.action_tag,
        is_claimed: false,
      };
    }
    return {
      success: true,
      error: "NONE",
      message: "NONE",
      questActionObj: questActionObj,
      questActionIds: questActionIds,
    };
  } catch (err) {
    return {
      success: false,
      error: "Quest Action Object Creation Failed.",
      message: "Quest Registration Failed.",
    };
  }
}
