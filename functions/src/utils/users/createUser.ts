/* eslint-disable max-len */
import {db} from "../init/init";
import * as functions from "firebase-functions";

export async function createUser(
    token : any,
    data: any
) {
  try {
    const isValid = await (await import("../validators/validateCreateUser")).validateCreateUser(token, data);
    if (!isValid.success) {
      return isValid;
    }

    const joinCount = await db.collection("xusers").count().get();
    const userObject = {
      "docType": "Individual",
      "name": data?.name ? data.name : data.username,
      "username": data.username,
      "image_url": token?.picture ? token?.picture : "",
      "email": token?.email ? token?.email : "",
      "socials": {
        "twitter_username": isValid.twitterUsername,
        "twitter_id": token?.firebase?.identities["twitter.com"] ? token?.firebase?.identities["twitter.com"][0] : "",
        "google_id": token?.firebase?.identities["google.com"] ? token?.firebase?.identities["google.com"][0] : "",
        "discord_id": isValid.discordId,
        "discord_username": isValid.discordUsername,
      },
      "wallets": {
        "evm": "",
        "solana": "",
      },
      "join_tag": joinCount.data().count + 1,
      "rank": Number(0),
      "level": Number(0),
      "invites": Number(0),
      "earned_rewards": isValid.inviterId !== "" ? Number(1) : Number(0),
      "quests_completed": Number(0),
      "inviter_id": isValid.inviterId,
      "inviter_code": data?.inviteCode,
      "generated_invite_code": "",
      "quests_registered": Number(0),
      "type": (await import("../enums/userType")).UserType.Individual,
      "registered_on": Math.ceil(new Date().getTime()/1000),
    };

    // Check if the invite code is locked for this user.
    const _lockedForUser = await db.collection("xinvite_codes_lock").doc(data?.inviteCode).get();
    if (_lockedForUser.exists) {
      const lockedForUserData: any = _lockedForUser.data();
      if (lockedForUserData.uid !== token?.uid) {
        return {success: false, message: "ERROR: Invite code is being used by someone else.", error: `Invite Code locked for different user. \nLocked For: ${lockedForUserData.uid}\nRequest For: ${token?.uid}`};
      }

      let batch = db.batch();
      // Individual Document
      const _user = db.collection("xusers").doc(token?.uid);
      batch.set(_user, userObject);

      // Creating Public Document
      const userPublicObject = {
        "docType": "Individual",
        "name": data?.name ? data.name : data.username,
        "username": data.username,
        "image_url": token?.picture ? token?.picture : "",
        "socials": {
          "twitter_username": isValid.twitterUsername,
          "twitter_id": token?.firebase?.identities["twitter.com"] ? token?.firebase?.identities["twitter.com"][0] : "",
          "google_id": token?.firebase?.identities["google.com"] ? token?.firebase?.identities["google.com"][0] : "",
          "discord_id": isValid.discordId,
          "discord_username": isValid.discordUsername,
        },
        "rank": Number(0),
        "level": Number(0),
        "invites": Number(0),
        "earned_rewards": isValid.inviterId !== "" ? Number(1) : Number(0),
        "quests_completed": Number(0),
      };
      const _userPublic = db.collection("xusers").doc(token?.uid).collection("public").doc("public");
      batch.set(_userPublic, userPublicObject);

      // Update Inviter User Record
      batch = await (await import("../helpers/updateInviteCode")).updateInviteCodeUserRecord(batch, data?.inviteCode, isValid.inviterType, token?.uid, Number(isValid.noOfInvites));

      // Unlock the invite code.
      batch = await (await import("../helpers/updateInviteCodeLock")).deleteInviteCodeLock(batch, data?.inviteCode);

      if (isValid.inviterId !== "") {
        // Update Inviter Rewards
        batch = await (await import("../helpers/updateInviter")).updateInviterRewards(
            batch,
            isValid.inviterId,
            1, // Invited User Count
            1, // Invited User Reward
        );

        // Update Inviter Invited.
        batch = await (await import("../helpers/updateInviter")).updateInviterInvitedUserData(
            batch,
            isValid.inviterId,
            token?.uid,
            isValid.inviterType
        );

        if (isValid.superInviterId !== "") {
          // Update SuperInviter Reward
          batch = await (await import("../helpers/updateInviter")).updateSuperInviterRewards(
              batch,
              isValid.superInviterId,
              1, // Reward Amount
          );
        }

        if (isValid.isUserBlackListedData) {
          // Update User BlackList
          batch = await (await import("../helpers/userBlackList")).deleteUserBlackList(batch, token?.uid);
        }
      }
      try {
        const commitResult = await batch.commit();
        if (commitResult) {
          return {
            success: true,
            message: "SUCCESS: User Created!",
            error: "NONE",
          };
        }
        return {
          success: false,
          message: "Error Processing Request",
          error: "Something went wrong: Batch Commit Failed.",
        };
      } catch (err) {
        functions.logger.error(`Something Wrong happened: Batch Commit\nError Details: \t${err}`);
        return {
          success: false,
          message: "ERROR",
          error: `Something Wrong happened: Batch Commit \nError Details: \t${err}`,
        };
      }
    }
    return {success: false, message: "Error Processing Request", error: "Something went wrong: Invite Code should have been locked."};
  } catch (err) {
    console.log(err);
    return {success: false, message: "ERROR", error: `Something Wrong happened: \nError Details: \t${err}`};
  }
}
