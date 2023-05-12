/* eslint-disable max-len */
import {db} from "../init/init";

export async function verifyInviteCode(
    token: any,
) {
  if (!token?.uid ) {
    return {success: false, message: "ERROR: Invalid Token"};
  }
  try {
    // Check if the invite_code is valid.
    const _user = await db.collection("xusers").doc(token?.uid).collection("invites").doc("invites").get();
    if (_user.exists) {
      const user: any = _user.data();
      if (Number(user.invited_users.length) === Number(user.max_invites)) {
        return {success: true, message: "SUCCESS!"};
      }
      return {success: false, message: "ERROR: Task verification failed!", pending_invites: Number(user.max_invites) - Number(user.invited_users.length)};
    }
    return {success: false, message: "ERROR: Invalid Request. No `invite_code` generated!"};
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
