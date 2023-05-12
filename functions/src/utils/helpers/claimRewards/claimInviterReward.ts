/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function claimInviterReward(
    batch: WriteBatch,
    userId: string,
    inviterId: string,
    inviterCode: string
) {
  if (inviterId === "") {
    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  }

  try {
    const currentTimestamp: number = Math.ceil(new Date().getTime() / 1000);

    // 1. Determine the type of inviter.
    const inviteCode = await db.collection("xinvite_codes").doc(`${inviterCode}`).get();
    if (!inviteCode.exists) {
      return {
        success: false,
        message: "ERROR: Invited Invite Code doesn't exist.",
        error: "Invited Invite Code doesn't exist.",
        batch,
      };
    }

    const inviterCodeType: string = inviteCode.get("user_type");
    if (inviterCodeType === (await import("../../enums/userType")).UserType.OGInviter) {
      const ogInviter = await claimOGInviterReward(
          batch,
          userId,
          inviterId,
          currentTimestamp
      );

      if (!ogInviter.success) {
        return {
          success: ogInviter.success,
          error: ogInviter.error,
          message: ogInviter.message,
          batch,
        };
      }

      batch = ogInviter.batch;
    } else if (inviterCodeType === (await import("../../enums/userType")).UserType.Individual) {
      const normalInviter = await claimNormalInviterReward(
          batch,
          userId,
          inviterId,
      );

      if (!normalInviter.success) {
        return {
          success: normalInviter.success,
          error: normalInviter.error,
          message: normalInviter.message,
          batch,
        };
      }

      batch = normalInviter.batch;
    }

    return {
      success: true,
      error: "Claims Successfully!",
      message: "Claims Successfully!",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: linkUserTwitter \nError Details: \t${err}`,
      batch,
    };
  }
}

async function claimOGInviterReward(
    batch: WriteBatch,
    userId: string,
    inviterId: string,
    currentTimestamp: number
) {
  // 1. Check if Inviter Exists.
  const inviter = await db.collection("xusers").doc(`${inviterId}`).collection("invites").doc("og_invites").get();
  if (!inviter.exists) {
    return {
      success: false,
      error: "Inviter Doesn't exist.",
      message: "ERORR: Inviter Doesn't exist.",
      batch,
    };
  }

  // 2. Check if already claimed.
  const isClaimed = await db.collection("xusers").doc(`${inviterId}`).collection("invites").doc("og_invites").collection("claimed_bonus_users").doc(`${userId}`).get();
  if (isClaimed.exists) {
    return {
      success: true,
      error: "Already Claimed",
      message: "Already Claimed",
      batch,
    };
  }

  // 3. Update inviter Rewards.
  batch = await (await import("../updateUser")).updateUserEarnedReward(
      batch,
      inviterId,
      Number(2)
  );

  // 4. Update OG Inviter Rewards Document.
  batch = await (await import("../updateUser")).updateOGInvitesData(
      batch,
      inviterId,
      Number(1),
      Number(2)
  );

  // 5. Update Claimed Users collection.
  batch = await (await import("../updateUser")).updateClaimedOGInvitedUserBonus(
      batch,
      userId,
      inviterId,
      Number(2),
      currentTimestamp
  );

  return {
    success: true,
    error: "Claimed",
    message: "Claimed",
    batch,
  };
}

async function claimNormalInviterReward(
    batch: WriteBatch,
    userId: string,
    inviterId: string
) {
  // 1. Check if Inviter Exists.
  const inviter = await db.collection("xusers").doc(`${inviterId}`).collection("invites").doc("invites").get();
  if (!inviter.exists) {
    return {
      success: false,
      error: "Inviter Doesn't exist.",
      message: "ERORR: Inviter Doesn't exist.",
      batch,
    };
  }

  // 2. Check if already claimed.
  const claimedBonusUsers: any[] = inviter.get("claimed_bonus_users");
  if (claimedBonusUsers.includes(userId)) {
    return {
      success: true,
      error: "Already Claimed",
      message: "Already Claimed",
      batch,
    };
  }

  // 3. Update Inviter Rewards.
  batch = await (await import("../updateUser")).updateUserEarnedReward(
      batch,
      inviterId,
      Number(2)
  );

  // 4. Update Inviter Document.
  batch = await (await import("../updateUser")).updateNormalInvitesData(
      batch,
      userId,
      inviterId,
      Number(2),
  );

  return {
    success: true,
    error: "Claimed",
    message: "Claimed",
    batch,
  };
}
