/* eslint-disable max-len */
import {db} from "../init/init";
export async function checkIfUsernameAvailable(
    username: string
) {
  try {
    const docs = await db.collection("xusers").where("username", "==", username).get();
    return !(docs.size > 0);
  } catch (err) {
    console.error(err);
    return false;
  }
}
