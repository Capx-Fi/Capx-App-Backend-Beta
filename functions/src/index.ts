/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";

exports.v1 = functions.runWith({timeoutSeconds: 540, maxInstances: 15, memory: "512MB"}).https.onRequest( async (req, res) => {
  (await import("./utils/servers/server")).server(req, res);
});

exports.discord = functions.runWith({timeoutSeconds: 540, maxInstances: 4}).https.onRequest( async (req, res) => {
  (await import("./utils/servers/discord")).server(req, res);
});

exports.updateUserPublicDocument = functions.runWith({timeoutSeconds: 540, maxInstances: 10}).firestore.document("xusers/{userId}").onUpdate( async (change, context) => {
  const newUserData = change.after.data();
  const oldUserData = change.before.data();

  await (await import("./utils/firestore/updateUserPublicDoc")).updateUserPublicDoc(newUserData, oldUserData, context.params.userId);
});

exports.updateQuestPublicDocument = functions.runWith({timeoutSeconds: 540, maxInstances: 7}).firestore.document("xorgs/{orgId}/quests/{questId}").onUpdate( async (change, context) => {
  const newQuestData = change.after.data();
  const oldQuestData = change.before.data();

  if (!context.params.questId.includes("quest_agg")) {
    await (await import("./utils/firestore/updateQuestPublicDoc")).updateQuestPublicDoc(newQuestData, oldQuestData, context.params.orgId, context.params.questId);
  }
});

exports.updateOrgPublicDocument = functions.runWith({timeoutSeconds: 540}).firestore.document("xorgs/{orgId}").onUpdate( async (change, context) => {
  const newOrgData = change.after.data();

  await (await import("./utils/firestore/updateOrgPublicDoc")).updateOrgPublicDoc(newOrgData, context.params.orgId);
});

exports.updateDailyRewardsQuests = functions.runWith({timeoutSeconds: 540}).firestore.document("xquest_order/{quest_order_id}").onUpdate(async (change, context) => {
  const oldQuestData = change.before.data();
  const newQuestData = change.after.data();
  const questOrderId = context.params.quest_order_id;
  const actionsObject: any = newQuestData?.actions[`${questOrderId}-1`];
  if (
    oldQuestData?.quest_type === "DailyReward" &&
    oldQuestData?.quest_category === "Daily_Reward" &&
    oldQuestData?.status === "CLAIMED" &&
    newQuestData?.status === "IN_PROGRESS" &&
    actionsObject?.action_order_status === "PENDING" &&
    actionsObject?.is_claimed === false
  ) {
    await (await import("./utils/firestore/updateDailyRewardsQuests")).updateDailyRewardsQuests(questOrderId, oldQuestData);
  }
});

exports.resetdailyrewards = onSchedule("0 0 * * *", async () => {
  await (await import("./utils/scheduled-job/resetDailyRewards")).resetDailyRewards();
});
