/* eslint-disable max-len */
import {db} from "../init/init";
import {StatusType} from "../enums/statusType";
import {OrderStatus} from "../enums/orderStatus";
import {getUserQuestOrderAggDoc} from "../helpers/getUserQuestOrderAggDoc";
import * as functions from "firebase-functions";

export async function updateDailyRewardsQuests(
    questOrderId: string,
    oldQuestOrderData: any
) {
  try {
    // 1. Update Action Status to PENDING
    const actionOrderUpdate = await db.collection("xquest_order").doc(questOrderId).collection("action_order").doc(`${questOrderId}-1`).update({
      action_order_status: OrderStatus.PENDING,
      is_claimed: false,
    });
    if (actionOrderUpdate) {
      // 2. Update User -> Quest Aggregate Data.
      const _user = await db.collection("xusers").doc(questOrderId.split("|")[1]).get();
      if (_user) {
        const user: any = _user.data();
        const maxAggDoc = Number(Math.floor(Number(user?.quests_registered)/20).toFixed(0)) + 1;
        const _aggId = await getUserQuestOrderAggDoc(_user.id, maxAggDoc, questOrderId);
        if (_aggId != 0) {
          const _newUserOrderAggData: any = {};
          _newUserOrderAggData[`quests.${questOrderId}.status`] = StatusType.IN_PROGRESS;
          const _updateUserOrderAgg = await db.collection("xusers").doc(_user.id).collection("quest-order").doc(_aggId.toString()).update(_newUserOrderAggData);
          if (_updateUserOrderAgg) {
            functions.logger.info("Updated Successfully: ", _user.id);
          } else {
            functions.logger.error("User Aggregate Update Error!");
            await db.collection("xquest_order").doc(questOrderId).collection("action_order").doc(`${questOrderId}-1`).update({
              action_order_status: OrderStatus.COMPLETED,
              is_claimed: true,
            });
            await db.collection("xquest_order").doc(questOrderId).update(oldQuestOrderData);
          }
        } else {
          functions.logger.error("User Aggregate Update Error!");
          await db.collection("xquest_order").doc(questOrderId).collection("action_order").doc(`${questOrderId}-1`).update({
            action_order_status: OrderStatus.COMPLETED,
            is_claimed: true,
          });
          await db.collection("xquest_order").doc(questOrderId).update(oldQuestOrderData);
        }
      } else {
        functions.logger.error("User NOT FOUND!");
        await db.collection("xquest_order").doc(questOrderId).collection("action_order").doc(`${questOrderId}-1`).update({
          action_order_status: OrderStatus.COMPLETED,
          is_claimed: true,
        });
        await db.collection("xquest_order").doc(questOrderId).update(oldQuestOrderData);
      }
    } else {
      functions.logger.error("Action Order Update Error!");
      await db.collection("xquest_order").doc(questOrderId).update(oldQuestOrderData);
    }
  } catch (err) {
    functions.logger.error("Error: \n", err);
  }
}
