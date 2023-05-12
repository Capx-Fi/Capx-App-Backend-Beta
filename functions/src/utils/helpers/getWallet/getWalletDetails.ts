/* eslint-disable max-len */
import {db} from "../../init/init";

export async function getWalletDetails(
    token: any
) {
  // Validate Request.
  if (!token?.uid) {
    return {
      success: false,
      message: "ERROR: Invalid Token",
      error: "Missing `uid` in token.",
    };
  }

  // Read User Aggregate Document.
  const userId: string = token?.uid;
  const _user = await db.collection("xusers").doc(`${userId}`).get();
  if (!_user.exists) {
    return {
      success: false,
      message: "ERROR: User doesn't exist.",
      error: `User NOT Found, ${token?.uid}`,
    };
  }

  let totalCalulatedRewards = 0;
  const walletDetails: any = [];

  // Extract.
  const user: any = _user.data();
  const questsRegistered = Number(user?.quests_registered);

  if (questsRegistered > 0) {
    const maxAggId = Number(Math.floor((questsRegistered)/20).toFixed(0)) + 1;
    const quests: any[] = [];
    for (let i = 1; i <= maxAggId; i++) {
      const doc = await db.collection("xusers").doc(token?.uid).collection("quest-order").doc(`${i}`).get();
      if (doc.exists) {
        const questIds: any = await doc.get("quests");
        quests.push(...Object.keys(questIds));
      }
    }

    const docsRetrieval: any[] = [];
    for (let i = 0; i <= quests.length; i++) {
      const userDoc = db.collection("xquest_order").doc(`${quests[i]}`);
      docsRetrieval.push(userDoc);
    }

    // Retrieve Docs.
    const docs = await db.getAll(...docsRetrieval);
    for (let x = 0; x < docs.length; x++) {
      if (docs[x].exists) {
        const data: any = docs[x].data();
        if ( data?.status === (await import("../../enums/statusType")).StatusType.CLAIMED) {
          if (data?.quest_category === (await import("../../enums/questCategoryType")).QuestCategoryType.DailyReward) {
            const actionOrder = await db.collection("xquest_order").doc(`${docs[x].id}`).collection("action_order").doc(`${docs[x].id}-1`).get();
            walletDetails.push({
              date: new Date(Number(actionOrder.get("last_claimed_at"))*1000).toDateString().substr(4),
              earned_rewards: data?.points_rewarded,
              max_rewards: data?.max_rewards,
              title: "Daily Streak Reward",
              streak: actionOrder.get("streak"),
              rewards_type: data?.rewards_type,
            });
            totalCalulatedRewards += Number(data?.points_rewarded);
          } else {
            walletDetails.push({
              date: data?.quest_end_date ? new Date(Number(data.quest_end_date)*1000).toDateString().substr(4) : new Date(Number(data.quest_start_date)*1000).toDateString().substr(4),
              earned_rewards: data?.points_rewarded,
              max_rewards: data?.max_rewards,
              title: data.quest_title,
              rewards_type: data?.rewards_type,
            });
            totalCalulatedRewards += Number(data?.points_rewarded);
          }
        } else if (data?.status === (await import("../../enums/statusType")).StatusType.IN_PROGRESS && data?.quest_category === (await import("../../enums/questCategoryType")).QuestCategoryType.DailyReward) {
          const actionOrder = await db.collection("xquest_order").doc(`${docs[x].id}`).collection("action_order").doc(`${docs[x].id}-1`).get();
          walletDetails.push({
            date: new Date(Number(actionOrder.get("last_claimed_at"))*1000).toDateString().substr(4),
            earned_rewards: data?.points_rewarded,
            max_rewards: data?.max_rewards,
            title: "Daily Streak Reward",
            streak: actionOrder.get("streak"),
            rewards_type: data?.rewards_type,
          });
          totalCalulatedRewards += Number(data?.points_rewarded);
        }
      }
    }
  }
  const inviteProgramRewards = await (await import("../getInviteProgram/getInviterProgramRewards")).getInviterProgramRewards(userId, user);
  if (!inviteProgramRewards.success) {
    return {
      success: false,
      message: "ERROR: Error Processing Request",
      error: "Normal Invite Code Fetch Error:"+inviteProgramRewards.error,
    };
  }
  if (Number(inviteProgramRewards.inviterRewards) > 0) {
    walletDetails.push({
      date: new Date().toDateString().substr(4),
      earned_rewards: inviteProgramRewards.inviterRewards,
      title: "Normal - Primary Invite Reward",
      rewards_type: "IOU",
    });
    totalCalulatedRewards += Number(inviteProgramRewards.inviterRewards);
  }
  if (Number(inviteProgramRewards.inviteeRewards) > 0) {
    walletDetails.push({
      date: new Date().toDateString().substr(4),
      earned_rewards: inviteProgramRewards.inviteeRewards,
      title: "Normal - Secondary Invite Reward",
      rewards_type: "IOU",
    });
    totalCalulatedRewards += Number(inviteProgramRewards.inviteeRewards);
  }

  const ogInviteProgramRewards = await (await import("../getInviteProgram/getOGInviterProgramRewards")).getOGInviterProgramRewards(userId, user);
  if (!ogInviteProgramRewards.success) {
    return {
      success: false,
      message: "ERROR: Error Processing Request",
      error: "OG Invite Code Fetch Error:"+ogInviteProgramRewards.error,
    };
  }
  if (Number(ogInviteProgramRewards.inviterRewards) > 0) {
    walletDetails.push({
      date: new Date().toDateString().substr(4),
      earned_rewards: ogInviteProgramRewards.inviterRewards,
      title: "OG - Primary Invite Reward",
      rewards_type: "IOU",
    });
    totalCalulatedRewards += Number(ogInviteProgramRewards.inviterRewards);
  }
  if (Number(ogInviteProgramRewards.inviteeRewards) > 0) {
    walletDetails.push({
      date: new Date().toDateString().substr(4),
      earned_rewards: ogInviteProgramRewards.inviteeRewards,
      title: "OG - Secondary Invite Reward",
      rewards_type: "IOU",
    });
    totalCalulatedRewards += Number(ogInviteProgramRewards.inviteeRewards);
  }
  if (Number(user?.earned_rewards) - Number(totalCalulatedRewards) === 1 && user?.inviter_id !== "") {
    walletDetails.push({
      date: new Date(Number(user?.registered_on)*1000).toDateString().substr(4),
      earned_rewards: Number(1),
      title: "Signup Reward",
      rewards_type: "IOU",
    });
  }
  return {
    success: true,
    message: "SUCCESS",
    error: "NONE",
    wallet: walletDetails,
  };
}
