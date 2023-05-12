/* eslint-disable max-len */
import {db} from "../init/init";

export async function validateLinkTwitterRequest(
    token: any
) {
  // 1. Validate Token Object.
  const isValidToken = await validateTokenObject(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  // 2. Validate user.
  const userId: string = token?.uid;
  const validUser = await validateUser(userId);
  if (!validUser.success) {
    return {
      success: validUser.success,
      error: validUser.error,
      message: validUser.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateTokenObject(
    token: any
) {
  if (!token?.uid) {
    return {
      success: false,
      message: "ERROR: Invalid Token",
      error: `Invalid Token. \nToken Details: ${token}`,
    };
  }

  if (!token?.firebase?.identities["twitter.com"]) {
    return {
      success: false,
      message: "ERROR: Token Missing `twitter` credentials!",
      error: "Token Missing `twitter` credentials!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateUser(
    userId: string
) {
  const _user = await db.collection("xusers").doc(`${userId}`).get();
  if (!_user.exists) {
    return {
      success: false,
      error: "User Doesn't Exist.",
      message: "Invalid UserId",
    };
  }

  const user: any = _user.data();
  if (user?.socials["twitter_id"] !== "") {
    return {
      success: true,
      message: "ERROR: Twitter already linked.",
      error: "Twitter already linked.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}
