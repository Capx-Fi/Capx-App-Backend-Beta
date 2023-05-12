/* eslint-disable max-len */
import {db} from "../init/init";
import * as functions from "firebase-functions";
import {WriteBatch} from "firebase-admin/firestore";
import {ethers} from "ethers";

export async function updateUserQuestRegisterationDetails(
    batch: WriteBatch,
    quest: any,
    userId: string,
    questOrderId: string,
    userRegisteredQuest: number
) {
  // 1. Create Quest Agg Object.
  const questAggObj: any = await createQuestAggObj(quest);

  // 2. Update User Register Count
  batch = await updateUserRegisteredQuestCount(
      batch,
      userId,
      1 // Only 1 user.
  );

  // 3. Update User Quest Order Aggregate Document.
  batch = await updateUserQuestRegisteredAggDoc(
      batch,
      userId,
      questOrderId,
      userRegisteredQuest,
      questAggObj
  );

  return batch;
}

async function updateUserRegisteredQuestCount(
    batch: WriteBatch,
    userId: string,
    increment: number
) {
  const updateUserQuest = db.collection("xusers").doc(`${userId}`);
  const updateUserQuestObj = {
    "quests_registered": (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };
  batch.update(updateUserQuest, updateUserQuestObj);

  return batch;
}

async function updateUserQuestRegisteredAggDoc(
    batch: WriteBatch,
    userId: string,
    questOrderId: string,
    questUserCount: number,
    questAggObj: any
) {
  const _regDocId = Number(Math.floor((Number(questUserCount) + 1)/20).toFixed(0)) + 1;
  const regDoc = db.collection("xusers").doc(userId).collection("quest-order").doc(`${_regDocId}`);

  const regDocExists = await regDoc.get();
  if (!regDocExists.exists) {
    // Create new Document.
    const temp: any = {};
    temp[`${questOrderId}`] = questAggObj;

    batch.create(
        regDoc,
        {
          docType: "Aggregate",
          quests: temp,
        }
    );
  } else {
    // Update old document.
    const temp: any = {};
    temp[`quests.${questOrderId}`] = questAggObj;

    batch.update(
        regDoc,
        temp
    );
  }

  return batch;
}

async function createQuestAggObj(
    quest: any,
) {
  const questAggObj: any = {
    title: quest.quest_title,
    quest_type: quest?.quest_type,
    quest_category: quest?.quest_category,
    reward_type: quest.rewards_type,
    max_rewards: Number(quest.max_rewards),
    status: (await import("../enums/statusType")).StatusType.REGISTERED,
    start_time_date: Math.ceil(new Date().getTime() / 1000),
  };

  return questAggObj;
}

export async function updateUserProfileName(
    userId: string,
    profileName: string,
    batch: WriteBatch
) {
  try {
    const userNameObj: any = {
      name: profileName,
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userNameObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userNameObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: updateUserProfileName \nError Details: \t${err}`,
      batch,
    };
  }
}

export async function updateUserComdexWallet(
    userId: string,
    comdexAddress: string,
    batch: WriteBatch
) {
  try {
    const userNameObj: any = {
      "wallets.cosmos": {
        "comdex": comdexAddress,
      },
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userNameObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userNameObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: updateUserComdexWallet \nError Details: \t${err}`,
      batch,
    };
  }
}


export async function updateUserCapxWallet(
    userId: string,
    walletAddress: string,
    batch: WriteBatch
) {
  try {
    const checkSumAddress = ethers.utils.getAddress(walletAddress);
    const userNameObj: any = {
      "wallets.evm": `${checkSumAddress}`,
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userNameObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userNameObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: updateUserCapxWallet \nError Details: \t${err}`,
      batch,
    };
  }
}

export async function updateUserProfileImage(
    userId: string,
    profileImg: string,
    batch: WriteBatch
) {
  try {
    const userNameObj: any = {
      image_url: profileImg,
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userNameObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userNameObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      batch,
    };
  } catch (err) {
    functions.logger.error(`Something Wrong happened: \nError Details: \t${err}`);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: updateUserProfileImage \nError Details: \t${err}`,
      batch,
    };
  }
}

export async function linkUserTwitter(
    token: any,
    userId: string,
    batch: WriteBatch
) {
  try {
    // Check if the twitter_id in scope is already linked to a different account.
    const twitterId: string = token?.firebase?.identities["twitter.com"][0].toString();
    const ifExists = await db.collection("xusers").where("socials.twitter_id", "==", twitterId).get();
    if (ifExists.size !== 0) {
      if (ifExists.size === 1) {
        if (ifExists.docs[0].id === userId) {
          return {
            success: true,
            message: "ERROR: Twitter already linked.",
            error: "Twitter already linked.",
            batch,
          };
        }
      }
      return {
        success: false,
        message: "ERROR: Twitter already linked to different user",
        error: "Twitter already linked to different user",
        batch,
      };
    }

    const twitterUsername: string = await (await import("../twitter/getUsernameFromId")).getUsernameFromId(twitterId);

    const userTwitterObj: any = {
      "socials.twitter_id": twitterId,
      "socials.twitter_username": twitterUsername,
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userTwitterObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userTwitterObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
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

export async function linkUserDiscord(
    token: any,
    userId: string,
    batch: WriteBatch
) {
  try {
    // Check if the discord_id in scope is already linked to a different account.
    const discordId: string = token?.discord?.id.toString();
    const username: string = token?.discord?.username.toString();
    const discriminator: string = token?.discord?.discriminator.toString();

    const ifExists = await db.collection("xusers").where("socials.discord_id", "==", discordId).get();
    if (ifExists.size !== 0) {
      if (ifExists.size === 1) {
        if (ifExists.docs[0].id === userId) {
          return {
            success: true,
            message: "ERROR: Discord already linked.",
            error: "Discord already linked.",
            batch,
          };
        }
      }
      return {
        success: false,
        message: "ERROR: Discord already linked to different user",
        error: "Discord already linked to different user",
        batch,
      };
    }

    const userDiscordObj: any = {
      "socials.discord_id": discordId,
      "socials.discord_username": username+"#"+discriminator,
    };

    // 1. Update Name in User Collection.
    const userRef = db.collection("xusers").doc(`${userId}`);
    batch.update(userRef, userDiscordObj);

    // 2. Update Name in User Public Collection.
    const userPubRef = userRef.collection("public").doc("public");
    batch.update(userPubRef, userDiscordObj);

    return {
      success: true,
      message: "NONE",
      error: "NONE",
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

export async function createUserAggDocObj(
    userId: string,
    questOrderId: string,
    userQuestCount: number,
    status: string
) {
  const maxAggDocId = Number(Math.floor(Number(userQuestCount)/20).toFixed(0)) + 1;
  const aggDocId = await (await import("./getUserQuestOrderAggDoc")).getUserQuestOrderAggDoc(userId, maxAggDocId, questOrderId);

  if (aggDocId === 0) {
    return {
      success: false,
      error: "Update User Order Aggregate document doesn't exist.",
      message: "Unable to Complete Quest.",
    };
  }

  const userQuestAggObj : any = {};
  userQuestAggObj[`quests.${questOrderId}.status`] = status;

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    aggDocId: aggDocId,
    userQuestAggObj: userQuestAggObj,
  };
}

export async function updateCMDXTypeEarnedReward(
    user: any,
    reward: number
) {
  let userObj: any = {};
  if (user?.comdex_earned_rewards) {
    userObj = {
      comdex_earned_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(reward),
    };
  } else {
    userObj = {
      comdex_earned_rewards: Number(reward),
    };
  }

  return userObj;
}

export async function updateUserEarnedReward(
    batch: WriteBatch,
    userId: string,
    increment: number
) {
  const userObj: any = {
    earned_rewards: (await import("firebase-admin/firestore")).FieldValue.increment(increment),
  };

  const userRef = db.collection("xusers").doc(`${userId}`);
  batch.update(userRef, userObj);

  return batch;
}

export async function updateOGInvitesData(
    batch: WriteBatch,
    userId: string,
    claimedUserCount: number,
    claimedBonusAmt: number
) {
  const userObj: any = {
    claimed_bonus_users: (await import("firebase-admin/firestore")).FieldValue.increment(claimedUserCount),
    bonus_reward: (await import("firebase-admin/firestore")).FieldValue.increment(claimedBonusAmt),
  };

  const userRef = db.collection("xusers").doc(`${userId}`).collection("invites").doc("og_invites");
  batch.update(userRef, userObj);

  return batch;
}

export async function updateNormalInvitesData(
    batch: WriteBatch,
    userId: string,
    inviterId: string,
    claimedBonusAmt: number
) {
  const userObj: any = {
    claimed_bonus_users: (await import("firebase-admin/firestore")).FieldValue.arrayUnion(userId),
    bonus_reward: (await import("firebase-admin/firestore")).FieldValue.increment(claimedBonusAmt),
  };

  const userRef = db.collection("xusers").doc(`${inviterId}`).collection("invites").doc("invites");
  batch.update(userRef, userObj);

  return batch;
}

export async function updateClaimedOGInvitedUserBonus(
    batch: WriteBatch,
    userId: string,
    inviterId: string,
    claimedBonusAmt: number,
    currentTimestamp: number
) {
  const userObj: any = {
    docType: "Individual",
    user_id: userId,
    claimed_amount: Number(claimedBonusAmt),
    claimed_at: Number(currentTimestamp),
  };

  const userRef = db.collection("xusers").doc(`${inviterId}`).collection("invites").doc("og_invites").collection("claimed_bonus_users").doc(`${userId}`);
  batch.create(userRef, userObj);

  return batch;
}
