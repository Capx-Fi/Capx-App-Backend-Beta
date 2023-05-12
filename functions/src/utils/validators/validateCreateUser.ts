/* eslint-disable max-len */
import {db} from "../init/init";

export async function validateCreateUser(
    token: any,
    data: any
) {
  // 1. Validate Token Object
  const isValidToken = validateTokenObjects(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  // 2. Validate if Email is Verified.
  const isEmailVerified = checkEmailVerification(token);
  if (!isEmailVerified.success) {
    return {
      success: isEmailVerified.success,
      error: isEmailVerified.error,
      message: isEmailVerified.message,
    };
  }

  // 3. Check user is Blacklisted.
  const isBlacklisted = await (await import("../helpers/userBlackList")).checkIfUserBlackListed(token?.uid);
  if (!isBlacklisted.success) {
    return {
      success: isBlacklisted.success,
      error: isBlacklisted.error,
      message: isBlacklisted.message,
    };
  }

  // 4. Check if Invite Code is Valid.
  const isCodeValid = await handleCheckInviteCode(data.inviteCode, token?.uid, isBlacklisted.isUserBlacklistedData);
  if (!isCodeValid.success) {
    return {
      success: isCodeValid.success,
      error: isCodeValid.error,
      message: isCodeValid.message,
    };
  }

  // 5. Check if all properties are unique.
  const isUnique = await handleCheckUnique(token, data.username);
  if (!isUnique.success) {
    return {
      success: isUnique.success,
      error: isUnique.error,
      message: isUnique.message,
    };
  }

  // 6. Extract SuperInviter (if any)
  const superInviter = await extractSuperInviter(isCodeValid?.inviterType, isCodeValid?.inviterId);
  if (!superInviter.success) {
    return {
      success: superInviter.success,
      error: superInviter.error,
      message: superInviter.message,
    };
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    isUserBlackListedData: isBlacklisted.isUserBlacklistedData,
    inviterId: isCodeValid.inviterId,
    inviterType: isCodeValid.inviterType,
    noOfInvites: isCodeValid.noOfInvites,
    twitterUsername: isUnique.twitterUsername,
    discordUsername: isUnique.discordUsername,
    discordId: isUnique.discordID,
    superInviterId: superInviter.superInviterId,
  };
}

function validateTokenObjects(
    token: any
) {
  if (!(token?.email || token?.uid)) {
    return {success: false, message: "ERROR: Invalid Token", error: `Invalid Token. \nToken Details: ${token}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

function checkEmailVerification(
    token: any
) {
  if (
    !(
      token?.email_verified ||
            token?.firebase?.identities["twitter.com"] ||
            token?.discord
    )
  ) {
    return {success: false, message: "ERROR: Email NOT verified.", error: `Invalid Token. Email NOT Verified. \nToken Details: ${token}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function handleCheckInviteCode(
    inviteCode: string,
    userId: string,
    blackListData: any
) {
  const _isValid = await (await import("../helpers/checkInviteCode")).checkInviteCode(inviteCode, userId, blackListData);
  if (!_isValid.success) {
    if (_isValid.error === "Invite Code is under locked state.") {
      return {success: false, message: "ERROR: Invite code is being used by someone else.", error: `Invite Code locked for different user. \nRequest For: ${userId}`};
    } else if (_isValid.error === "Max invites limit reached.") {
      return {success: false, message: "ERROR: Invite Code Max limit reached.", error: `Invite Code Max invites limit reached. \nRequest For: ${userId}`};
    }
    return {success: false, message: "ERROR: Invalid Invite Code.", error: _isValid.error};
  }
  return {success: true, message: "NONE", error: "NONE", inviterId: _isValid.inviter_id, inviterType: _isValid.inviterType, noOfInvites: _isValid.noOfInvites};
}

async function handleCheckUnique(
    token: any,
    username: string
) {
  let discordID = "";
  let discordUsername = "";
  let twitterUsername = "";
  // Check Username
  const _checkUsername = await db.collection("xusers").where("username", "==", username).count().get();
  if (_checkUsername.data().count > 0) {
    return {success: false, message: "ERROR: Username already linked to a different user.", error: "Username already taken."};
  }

  // Check Email
  if (token?.email) {
    const _checkEmail = await db.collection("xusers").where("email", "==", token?.email?.toString()).count().get();
    if (_checkEmail.data().count > 0) {
      return {success: false, message: "ERROR: Email already linked to a different user.", error: "Email already registered."};
    }
  }

  // Check if Twitter ID is unique.
  if (token?.firebase?.identities["twitter.com"]) {
    const _checkTwitter = await db.collection("xusers").where("socials.twitter_id", "==", token?.firebase?.identities["twitter.com"][0].toString()).count().get();
    if (_checkTwitter.data().count > 0) {
      return {success: false, message: "ERROR: Twitter already linked to a different user.", error: "Twitter already linked to a different user."};
    }
    twitterUsername = await (await import("../twitter/getUsernameFromId")).getUsernameFromId(token?.firebase?.identities["twitter.com"][0].toString());
  }

  // Check if Email is unique
  if (token?.firebase?.identities["google.com"]) {
    const _checkGoogle = await db.collection("xusers").where("socials.google_id", "==", token?.firebase?.identities["google.com"][0].toString()).count().get();
    if (_checkGoogle.data().count > 0) {
      return {success: false, message: "ERROR: Google already linked to a different user.", error: "Google account already linked to a different user."};
    }
  }

  // Check if discord is unique.
  if (token?.discord) {
    const _checkDiscord = await db.collection("xusers").where("socials.discord_id", "==", token?.discord.id.toString()).count().get();
    if (_checkDiscord.data().count > 0) {
      return {success: false, message: "ERROR: Discord already linked to a different user.", error: "Discord Linked to a different user."};
    }
    discordID = token?.discord?.id.toString();
    discordUsername = token?.discord?.username.toString()+"#"+token?.discord?.discriminator.toString();
  }

  return {success: true, message: "NONE", error: "NONE", twitterUsername, discordID, discordUsername};
}

async function extractSuperInviter(
    inviterType: string,
    inviterId: string
) {
  if (inviterType === (await import("../enums/userType")).UserType.Individual) {
    const _inviter = await db.collection("xusers").doc(`${inviterId}`).get();
    if (!_inviter.exists) {
      // As this is an user generated invite code, hence a user must exist.
      return {success: false, message: "ERROR: Invalid invite code!", error: "Invalid Invite Code."};
    }
    const inviterData: any = _inviter.data();
    return {success: true, message: "NONE", error: "NONE", superInviterId: inviterData.inviter_id};
  }
  return {success: true, message: "NONE", error: "NONE", superInviterId: ""};
}
