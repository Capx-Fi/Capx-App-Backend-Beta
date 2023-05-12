/* eslint-disable max-len */
import {db} from "../init/init";

export async function updateQuestPublicDoc(
    newQuestData: any,
    oldQuestData: any,
    orgId: string,
    questId: string,
) {
  if (newQuestData.completed_by != oldQuestData.completed_by) {
    // TODO: Update Public Quest data.
    const questIndObjPub = {
      completed_by: newQuestData.completed_by,
    };
    const updatePublic = await db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("public").doc("public").update(questIndObjPub);
    if (updatePublic) {
      // Update Quest Aggregate Document.
      const questID = Number(questId.split("_")[1]);
      const aggID = Number(Math.floor(questID/20).toFixed(0)) + 1;
      const aggDocId = "quest_agg_"+aggID.toString();
      const temp: any = {};
      temp[`quests.${questId}.completed_by`] = newQuestData.completed_by;
      const aggData = await db.collection("xorgs").doc(orgId).collection("quests").doc(aggDocId).update(temp);
      if (aggData) {
        return true;
      }
      const questIndObjPub = {
        completed_by: oldQuestData.completed_by,
      };
      await db.collection("xorgs").doc(orgId).collection("quests").doc(questId).collection("public").doc("public").update(questIndObjPub);
      return false;
    }
    return false;
  }
  return true;
}
