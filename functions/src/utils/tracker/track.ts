/* eslint-disable max-len */
import {db} from "../init/init";

export async function registerError(
    userId: string,
    path: string,
    parameters: any,
    jwtToken: string,
    response: string
) {
  const currentTstmp = Math.ceil(new Date().getTime()/1000);
  await db.collection("xerror_responses").doc(userId).collection(path).doc(currentTstmp.toString()).set({
    parameters: parameters,
    access_token: jwtToken,
    error_message: response,
  });
  return true;
}
