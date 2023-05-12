/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {db} from "../init/init";

export async function updateUserPublicDoc(
    newUserData: any,
    oldUserData: any,
    userId: string
) {
  try {
    if (newUserData.invites !== oldUserData.invites || newUserData.earned_rewards !== oldUserData.earned_rewards || newUserData.quests_completed !== oldUserData.quests_completed) {
      // TODO: Update Public user data.
      const userPublicObject = {
        "invites": newUserData.invites,
        "earned_rewards": newUserData.earned_rewards,
        "quests_completed": newUserData.quests_completed,
      };
      const update = await db.collection("xusers").doc(userId).collection("public").doc("public").update(userPublicObject);
      if (update) {
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    functions.logger.error("Error: \n", err);
    return false;
  }
}
