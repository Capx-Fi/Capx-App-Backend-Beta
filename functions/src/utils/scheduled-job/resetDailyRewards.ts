/* eslint-disable max-len */
import {db} from "../init/init";
import {QuestType} from "../enums/questType";
import {StatusType} from "../enums/statusType";
import {OrderStatus} from "../enums/orderStatus";
import * as functions from "firebase-functions";
import {sendGridEmail} from "../helpers/sendGridEmail";


export async function resetDailyRewards() {
  // 1. Fetch all quest-orders where the quest_type is dailyReward
  console.log("Running Query");
  let i = 0;
  const questOrders = await db.collection("xquest_order").where("quest_type", "==", QuestType.DailyReward).where("status", "==", StatusType.CLAIMED).get();
  console.log(`Quests to update: ${questOrders.size}`);
  if (!questOrders.empty) {
    for (i; i < questOrders.size; i++) {
      const questOrder = questOrders.docs[i];
      const questOrderData = questOrder.data();
      try {
        if (questOrderData.status === StatusType.CLAIMED) {
          // 2. Set Quest Status IN_PROGRESS
          const temp: any = {};
          temp[`actions.${questOrder.id}-1.action_order_status`] = OrderStatus.PENDING;
          temp[`actions.${questOrder.id}-1.is_claimed`] = false;
          temp["status"] = StatusType.IN_PROGRESS;
          const questOrderUpdate = await db.collection("xquest_order").doc(questOrder.id).update(temp);
          if (questOrderUpdate) {
            console.log(`Progress - ${i+1}/${questOrders.size}: Quest Order Update SUCCESSFUL for ${questOrder.id}`);
          } else {
            functions.logger.error("Quest Order Update Error!");
          }
        }
      } catch (err) {
        functions.logger.error("Error: \n", err);
      }
    }
  }
  // Fire an event stating that update is complete.
  await sendGridEmail(i, questOrders.size);
}
