/* eslint-disable max-len */

import {WriteBatch} from "firebase-admin/firestore";
import {NotifyType} from "../enums/notifyType";

export async function sendNotification(
    action: any,
    email: string,
    batch: WriteBatch
) {
  try {
    if (action?.notification_type == NotifyType.Affiliate) {
      // TODO: Implement send Notification Engine here.
      return {
        success: true,
        error: "NONE",
        message: "NONE",
        batch,
      };
    } else if (action?.notification_type == NotifyType.Meme) {
      // TODO: Implement send Notification Engine here.
      return {
        success: true,
        error: "NONE",
        message: "NONE",
        batch,
      };
    }
    return {
      success: false,
      error: "Update Failed.",
      message: "Update Failed.",
      batch,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: `Something Broken: \nError Details: ${err}`,
      message: "Something Broken",
      batch,
    };
  }
}
