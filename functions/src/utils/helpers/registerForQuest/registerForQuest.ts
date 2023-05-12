/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function registerForQuest(
    token: any,
    data: any
) {
  try {
    // Validate Incoming Request.
    const validRequest = await (await import("../../validators/validateRegisterForQuest")).validateRegisterForQuest(token, data);
    if (!validRequest.success) {
      return validRequest;
    }

    const orgId: any = validRequest.orgId;
    const questOrderId: any = validRequest.questOrderId;
    const quest: any = validRequest.quest;
    const user: any = validRequest.user;

    // Batch Write.
    let batch = db.batch();

    // Create Quest Object.
    const createQuestOrderObj = await (await import("./questOrderObject")).createQuestOrderObject(
        quest,
        orgId,
        token?.uid,
        user?.username,
        data?.questId,
        questOrderId
    );
    if (!createQuestOrderObj.success) {
      return {
        success: createQuestOrderObj.success,
        error: createQuestOrderObj.error,
        message: createQuestOrderObj.message,
      };
    }

    const questActionIds: any = createQuestOrderObj?.questActionIds;
    const questOrderObj: any = createQuestOrderObj?.questOrderObj;

    // Create Quest Order Document.
    const _questOrder = db.collection("xquest_order").doc(`${questOrderId}`);
    batch.create(_questOrder, questOrderObj);

    // Create Action Order Object.
    const createActionOrderObj = await (await import("./actionOrderObject")).getActionOrderObject(
        orgId,
        token?.uid,
        data?.questId,
        questOrderId,
        questActionIds
    );
    if (!createActionOrderObj.success) {
      return {
        success: createActionOrderObj.success,
        error: createActionOrderObj.error,
        message: createActionOrderObj.message,
      };
    }

    const actionOrders = createActionOrderObj.actionObjs;
    for (let i = 0; i < actionOrders.length; i++) {
      const actionOrderId = actionOrders[i].actionOrderId;
      const actionOrderObj = actionOrders[i].actionOrderObj;
      const actionOrder = db.collection("xquest_order").doc(questOrderId).collection("action_order").doc(`${actionOrderId}`);
      batch.create(actionOrder, actionOrderObj);
    }

    // Update Registeration details.
    batch = await (await import("../updateQuest")).updateRegisteredUser(
        orgId,
        data?.questId,
        questActionIds,
        batch,
        token?.uid,
        Number(quest.user_count)
    );

    // Update User Agg Details.
    batch = await (await import("../updateUser")).updateUserQuestRegisterationDetails(
        batch,
        questOrderObj,
        token?.uid,
        questOrderId,
        user?.quests_registered
    );
    try {
      const commitResult = await batch.commit();
      if (commitResult) {
        return {
          success: true,
          message: "SUCCESS: User Registered!",
          error: "NONE",
          quest_order_id: questOrderId,
          quest_status: (await import("../../enums/statusType")).StatusType.REGISTERED,
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
    console.log(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: \nError Details: \t${err}`,
    };
  }
}
