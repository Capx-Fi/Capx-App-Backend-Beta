/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function updateUserProfile(
    token: any,
    data: any
) {
  // 1. Validate Request.
  const validRequest = await (await import("../../validators/validateUpdateUserProfile")).validateUpdateUserProfileRequest(token, data);
  if (!validRequest.success) {
    return {
      success: validRequest.success,
      error: validRequest.error,
      message: validRequest.message,
    };
  }

  const userId: string = token?.uid;

  // Batch Write.
  let batch = db.batch();

  if (data?.image_url) {
    const imageUrl: string = data?.image_url.trim();
    const updateProfileImg = await (await import("../updateUser")).updateUserProfileImage(userId, imageUrl, batch);
    if (!updateProfileImg.success) {
      return {
        success: updateProfileImg.success,
        error: updateProfileImg.error,
        message: updateProfileImg.message,
      };
    }

    batch = updateProfileImg.batch;
  }

  if (data?.name) {
    const name: string = data?.name.trim();
    const updateProfileName = (await (await import("../updateUser")).updateUserProfileName(
        userId,
        name,
        batch
    ));
    if (!updateProfileName.success) {
      return {
        success: updateProfileName.success,
        error: updateProfileName.error,
        message: updateProfileName.message,
        batch,
      };
    }

    batch = updateProfileName.batch;
  }

  try {
    const commitResult = await batch.commit();
    if (commitResult) {
      return {
        success: true,
        message: "SUCCESS: User Updated.",
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
