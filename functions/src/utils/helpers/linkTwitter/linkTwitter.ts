/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function linkTwitter(
    token: any
) {
  try {
    // Validate Incoming Request.
    const validRequest = await (await import("../../validators/validateLinkTwitter")).validateLinkTwitterRequest(token);
    if (!validRequest.success) {
      return {
        success: validRequest.success,
        error: validRequest.error,
        message: validRequest.message,
      };
    }

    // Batch Write.
    let batch = db.batch();

    const link = await (await import("../updateUser")).linkUserTwitter(
        token,
        token?.uid,
        batch
    );
    if (!link.success) {
      return {
        success: link.success,
        error: link.error,
        message: link.message,
      };
    }

    batch = link.batch;

    try {
      const commitResult = await batch.commit();
      if (commitResult) {
        return {
          success: true,
          message: "SUCCESS: Twitter Linked.",
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
  } catch (err) {
    functions.logger.error(`Something Wrong happened: LinkTwitter \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: LinkTwitter \nError Details: \t${err}`,
    };
  }
}
