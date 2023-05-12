/* eslint-disable max-len */
import {db} from "../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function generateInviteCode(
    user: any,
    userId: string,
    batch: WriteBatch,
) {
  try {
    if (user?.generated_invite_code !== "") {
      return {
        success: false,
        message: "ERROR: Code already generated!",
        invite_code: user.generated_invite_code,
        error: "Code Already Generated.",
        batch: batch,
      };
    }

    const inviteCodeGenerator = (await import("nanoid")).customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);
    let inviteCode: any = inviteCodeGenerator().toUpperCase();

    const isUnique = await checkIfUnique(inviteCode, inviteCodeGenerator);
    if (!isUnique.success) {
      return {
        success: isUnique.success,
        error: isUnique.error,
        message: isUnique.message,
        batch: batch,
      };
    }

    inviteCode = isUnique.inviteCode;

    // Create InviteCode Object.
    const inviteCodeObj: any = await createInviteCodeObj(userId, 10);
    const inviteCodeRef = db.collection("xinvite_codes").doc(`${inviteCode}`);

    batch.create(inviteCodeRef, inviteCodeObj);

    // Update Generated Invite Code.
    const userInviteCodeObj: any = createUserInviteCodeObj(inviteCode);
    const userRef = db.collection("xusers").doc(`${userId}`);

    batch.update(userRef, userInviteCodeObj);

    // Create Invites Obj
    const userInvitesObj: any = createUserInvitesObj(10);
    const userInvitesRef = userRef.collection("invites").doc("invites");

    batch.create(userInvitesRef, userInvitesObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: \nError Details: \t${err}`,
      batch: batch,
    };
  }
}

async function checkIfUnique(
    inviteCode: string,
    inviteCodeGenerator: any,
) {
  try {
    // Check if generate code is unique.
    const flag = true;
    while (flag) {
      const isUnique = await db.collection("xinvite_codes").doc(inviteCode).get();
      if (!isUnique.exists) {
        break;
      }
      inviteCode = inviteCodeGenerator().toUpperCase();
    }
    return {
      success: true,
      error: "NONE",
      message: "NONE",
      inviteCode,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened while Checking Unique Invite Code: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened while Checking Unique Invite Code: \nError Details: \t${err}`,
    };
  }
}

async function createInviteCodeObj(
    userId: string,
    maxInvites: number,
) {
  const inviteCodeObj: any = {
    user_id: userId,
    user_type: (await import("../enums/userType")).UserType.Individual,
    max_invites: Number(maxInvites),
    invited_users: [],
  };

  return inviteCodeObj;
}

function createUserInviteCodeObj(
    inviteCode: string
) {
  const userInviteCodeObj: any = {
    generated_invite_code: inviteCode,
  };

  return userInviteCodeObj;
}

function createUserInvitesObj(
    maxInvites: number
) {
  const userInvitesObj: any = {
    docType: "Aggregate",
    max_invites: Number(maxInvites),
    invited_users: [],
    claimed_bonus_users: [],
    bonus_reward: Number(0),
  };

  return userInvitesObj;
}
