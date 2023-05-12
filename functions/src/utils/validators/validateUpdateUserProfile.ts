/* eslint-disable max-len */
import {db} from "../init/init";

export async function validateUpdateUserProfileRequest(
    token: any,
    data: any
) {
  // 1. Validate Token Object.
  const isValidToken = await validateTokenObjects(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  // 2. Validate Inputs.
  const validInputs = await validateInputs(data);
  if (!validInputs.success) {
    return {
      success: validInputs.success,
      error: validInputs.error,
      message: validInputs.message,
    };
  }

  // 3. Validate user.
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

function validateTokenObjects(
    token: any
) {
  if (!token?.uid) {
    return {
      success: false,
      message: "ERROR: Invalid Token",
      error: `Invalid Token. \nToken Details: ${token}`,
    };
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function validateInputs(
    data: any
) {
  if (data?.image_url || data?.name) {
    if (data?.image_url) {
      const imageUrl: string = data?.image_url.trim();
      if (!(await import("../verifiers/inputVerifier")).imageUrlVerifier(imageUrl)) {
        return {
          success: false,
          message: "ERROR: Invalid value for parameter `image_url`!",
          error: "User provided invalid value for parameter `image_url`",
        };
      }
    }
    if (data?.name) {
      const name: string = data?.name.trim();
      if (name.length < 4) {
        return {
          success: false,
          message: "ERROR: Invalid parameter value for `name`, minimum 4 characters.",
          error: "Invalid parameter value for `name`, minimum 4 characters.",
        };
      }
    }
    return {success: true, message: "NONE", error: "NONE"};
  }
  return {
    success: false,
    message: "ERROR: Missing one (or) more parameter `image_url`, `name`",
    error: "ERROR: Missing one (or) more parameter `image_url`, `name`",
  };
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

  return {success: true, error: "NONE", message: "NONE"};
}
