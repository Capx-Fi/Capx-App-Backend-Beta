/* eslint-disable max-len */
import {db} from "../init/init";

export async function checkInviteCode(
    inviteCode: string,
    uid: string,
    userBlacklistData: any
) {
  try {
    const _currentTime = Math.ceil(new Date().getTime() / 1000);
    // Check if the invite code exists in the lock collection.
    const _inviteCodeLock = db.collection("xinvite_codes_lock").doc(inviteCode);
    const _inviteCode = db.collection("xinvite_codes").doc(inviteCode);

    const _retrievedDocs : any = {};
    try {
      const docs = await db.getAll(_inviteCode, _inviteCodeLock);
      for (let i = 0; i < docs.length; i++) {
        _retrievedDocs[docs[i].ref.path.split("/")[0]] = {
          id: docs[i].id,
          exists: docs[i].exists,
          data: docs[i].data(),
        };
      }
    } catch (err) {
      return {success: false, error: `Document Retrieval Failed. ${err}`};
    }

    if (_retrievedDocs["xinvite_codes_lock"].exists) {
      // Check if the elapsed time is greater than 1 Minute.
      const _inviteCodeData: any = _retrievedDocs["xinvite_codes_lock"];
      if (_currentTime - _inviteCodeData.locked_time < 600) {
        return {success: false, error: "Invite Code is under locked state."};
      }
    }
    // Check if invite code is valid
    if (_retrievedDocs["xinvite_codes"].exists) {
      // Set the invite code for the user into lock state.
      const _inviteCodeLocked = await (await import("../helpers/updateInviteCodeLock")).createInviteCodeLock(_inviteCodeLock, uid, _currentTime);
      if (_inviteCodeLocked) {
        // Check if the invite_code is system generated or user generated.
        const inviteCodeData: any = _retrievedDocs["xinvite_codes"].data;

        let inviterID = inviteCodeData?.user_id;
        let maxInvites = Number(inviteCodeData?.max_invites);

        const noOfInvitesUsed = inviteCodeData?.user_type != (await import("../enums/userType")).UserType.OGInviter ? Number(inviteCodeData?.invited_users.length) : Number(inviteCodeData?.invited_users);
        if (inviteCodeData?.user_type == (await import("../enums/userType")).UserType.Admin) {
          inviterID = "";
          // Check for the expiry.
          if (inviteCodeData.expiry < Math.ceil(new Date().getTime() / 1000) || !inviteCodeData.enabled) {
            return {success: false, error: "Invite Code expired (or) disabled"};
          }
        }
        // Update Max Invites
        maxInvites = await (await import("../helpers/updateInviteCode")).updateInviteCodeMaxInvites(_inviteCode, inviteCodeData?.user_type, noOfInvitesUsed, maxInvites);

        if (inviteCodeData?.user_type != (await import("../enums/userType")).UserType.OGInviter) {
          // Check if the number of users invited are valid.
          if (Number(inviteCodeData?.invited_users.length) + 1 > maxInvites) {
            return {success: false, error: "Max invites limit reached."};
          }
        } else {
          if (Number(inviteCodeData?.invited_users) + 1 > maxInvites) {
            return {success: false, error: "Max invites limit reached."};
          }
        }
        return {success: true, error: "NONE", inviter_id: inviterID, inviterType: inviteCodeData?.user_type, noOfInvites: noOfInvitesUsed};
      }
      return {success: false, error: "Invite Code cannot be locked."};
    }
    // Update Blacklist User details.
    await (await import("../helpers/userBlackList")).updateUserBlackListData(uid, _currentTime, userBlacklistData);

    return {success: false, error: "Invite Code doesn't exist."};
  } catch (err) {
    console.log(err);
    return {success: false, error: `Something Wrong happened: \nError Details: \t${err}`};
  }
}
