/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";

export async function completeQuestAction(
    token: any,
    data: any
) {
  try {
    const questActionOrderId: any = data?.action_order_id.trim();

    // Validate Incoming Request.
    const validRequest = await (await import("../../validators/validateCompleteAction")).validateCompleteActionRequest(token, data);
    if (!validRequest.success) {
      // Add 60 seconds delay for the next retry.
      await (await import("../updateQuest")).updateQuestActionOrderCall(questActionOrderId);
      return {
        success: validRequest.success,
        error: validRequest.error,
        message: validRequest.message,
      };
    }

    const userId: any = token?.uid;
    const actionId: any = validRequest.actionId;
    const questOrderId: any = validRequest.questOrderId;
    const streak = Number(validRequest.streak);

    const user: any = validRequest.user;
    const action: any = validRequest.action;
    const questOrder: any = validRequest.questOrder;
    const questActionOrder: any = validRequest.questActionOrder;

    // Batch Write.
    let batch = db.batch();

    const response = await handleCompleteQuestByActionType(
        data,
        user,
        token,
        action,
        questOrder,
        questActionOrder,
        streak,
        userId,
        actionId,
        questOrderId,
        questActionOrderId,
        batch
    );
    if (!response.success) {
      return {
        success: response.success,
        error: response.error,
        message: response.message,
      };
    }

    batch = response.batch;

    try {
      const commitResult = await batch.commit();
      if (commitResult) {
        return {
          success: true,
          message: response.message,
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
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: \nError Details: \t${err}`,
    };
  }
}

async function handleCompleteQuestByActionType(
    inputData: any,
    user: any,
    token: any,
    action: any,
    questOrder: any,
    questActionOrder: any,
    streak: number,
    userId: string,
    actionId: number,
    questOrderId: string,
    questActionOrderId: string,
    batch: WriteBatch,
) {
  try {
    let successMessage = "Action Completed Succesfully.";
    if (action?.type === (await import("../../enums/actionType")).ActionType.DailyReward) {
      const completeQuest = (await (await import("./dailyRewardQuest")).completeQuest(
          batch,
          user,
          action,
          questOrder,
          questActionOrder,
          userId,
          questOrderId,
          questActionOrderId,
          streak,
      ));
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      const rewardAmt = Number(completeQuest.rewardAmt);
      const nxtRewardAmt = Number(completeQuest.nextRewardAmt);
      const nxtRewardStreak = Number(completeQuest.nextRewardStreak);
      let postFix = "th";
      console.log(rewardAmt, nxtRewardAmt, nxtRewardStreak);

      if (streak === 1) {
        postFix = "st";
      } else if (streak === 2) {
        postFix = "nd";
      } else if (streak === 3) {
        postFix = "rd";
      }

      if (questOrder?.status !== (await import("../../enums/statusType")).StatusType.REGISTERED && streak === 1) {
        successMessage = "Hey!|Sorry, but you broke your streak. The system has been reset to Day 1. But don't worry, just make sure to check-in daily for 7 days straight to earn 2 xCapx tokens";
      } else if (rewardAmt > 0) {
        successMessage = `Congratulations!|You completed your ${streak} days streak! ${rewardAmt} xCapx tokens have been added to your wallet.%Keep checking in daily & maintain streak to earn more xCapx tokens`;
      } else {
        successMessage = `Awesome!|Good going, you are on the ${streak}${postFix} Day of your daily reward streak. Make sure to check-in daily for next ${nxtRewardStreak - streak} days to earn ${nxtRewardAmt} xCapx tokens`;
      }

      batch = completeQuest?.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.AlphaAirDrop) {
      const completeQuest = (await (await import("./alphaAirdropQuest")).completeQuest(
          batch,
          user,
          action,
          questOrder,
          userId,
          questActionOrderId,
          questOrderId,
      ));
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.Notify) {
      const email: string = inputData?.email.trim();
      const notifyResult = (await (await import("../../actions/sendNotification")).sendNotification(
          action,
          email,
          batch
      ));
      if (!notifyResult.success) {
        return {
          success: notifyResult.success,
          error: notifyResult.error,
          message: notifyResult.message,
          batch,
        };
      }

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.GenerateInviteCode) {
      const generateInviteCode = (await (await import("../../actions/generateInviteCode")).generateInviteCode(
          user,
          userId,
          batch
      ));
      if (!generateInviteCode.success) {
        return {
          success: generateInviteCode.success,
          error: generateInviteCode.error,
          message: generateInviteCode.message,
          batch,
        };
      }

      batch = generateInviteCode.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.GenerateOGInviteCode) {
      const generateInviteCode = (await (await import("../../actions/generateOGInviteCode")).generateOGInviteCode(
          user,
          userId,
          batch
      ));
      if (!generateInviteCode.success) {
        return {
          success: generateInviteCode.success,
          error: generateInviteCode.error,
          message: generateInviteCode.message,
          batch,
        };
      }

      batch = generateInviteCode.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.HarborAirdrop) {
      const updateComdexAdd = (await (await import("../updateUser")).updateUserComdexWallet(
          userId,
          inputData?.comdex_address.trim(),
          batch
      ));
      if (!updateComdexAdd.success) {
        return {
          success: updateComdexAdd.success,
          error: updateComdexAdd.error,
          message: updateComdexAdd.message,
          batch,
        };
      }

      batch = updateComdexAdd.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.ConnectCapxWallet) {
      const updateCapxAdd = (await (await import("../updateUser")).updateUserCapxWallet(
          userId,
          inputData?.wallet_address.trim(),
          batch
      ));
      if (!updateCapxAdd.success) {
        return {
          success: updateCapxAdd.success,
          error: updateCapxAdd.error,
          message: updateCapxAdd.message,
          batch,
        };
      }

      batch = updateCapxAdd.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.FullName) {
      const updateProfileName = (await (await import("../updateUser")).updateUserProfileName(
          userId,
          inputData?.name.trim(),
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

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.ProfileImage) {
      const updateProfileImg = (await (await import("../updateUser")).updateUserProfileImage(
          userId,
          inputData?.image_url.trim(),
          batch
      ));
      if (!updateProfileImg.success) {
        return {
          success: updateProfileImg.success,
          error: updateProfileImg.error,
          message: updateProfileImg.message,
          batch,
        };
      }

      batch = updateProfileImg.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.LinkTwitter) {
      const linkTwitter = (await (await import("../updateUser")).linkUserTwitter(
          token,
          userId,
          batch
      ));
      if (!linkTwitter.success) {
        return {
          success: linkTwitter.success,
          error: linkTwitter.error,
          message: linkTwitter.message,
          batch,
        };
      }

      batch = linkTwitter.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else if (action?.type === (await import("../../enums/actionType")).ActionType.LinkDiscord) {
      const linkDiscord = (await (await import("../updateUser")).linkUserDiscord(
          token,
          userId,
          batch
      ));
      if (!linkDiscord.success) {
        return {
          success: linkDiscord.success,
          error: linkDiscord.error,
          message: linkDiscord.message,
          batch,
        };
      }

      batch = linkDiscord.batch;

      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    } else {
      const completeQuest = await (await import("./defaultQuest")).completeQuest(
          batch,
          user,
          action,
          inputData,
          questOrder,
          userId,
          actionId,
          questActionOrderId,
          questOrderId
      );
      if (!completeQuest.success) {
        return {
          success: completeQuest.success,
          error: completeQuest.error,
          message: completeQuest.message,
          batch,
        };
      }

      batch = completeQuest.batch;
    }

    return {
      success: true,
      message: successMessage,
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: handleCompleteQuestByActionType \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: handleCompleteQuestByActionType \nError Details: \t${err}`,
      batch,
    };
  }
}
