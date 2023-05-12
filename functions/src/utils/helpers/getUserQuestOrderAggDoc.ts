/* eslint-disable max-len */
import {db} from "../init/init";

export async function getUserQuestOrderAggDoc(
    userId: string,
    maxAggDoc: number,
    questOrderId: string
) {
  // Find the userQuestOrderAgg doc where it should be updated.
  for (let docId = 1; docId <= maxAggDoc; docId++ ) {
    const _userOrderAgg = await db.collection("xusers").doc(userId).collection("quest-order").doc(docId.toString()).get();
    if (_userOrderAgg.exists) {
      const data: any = _userOrderAgg.data();
      if (Object.keys(data?.quests).includes(questOrderId)) {
        return docId;
      }
    }
  }
  return 0;
}
