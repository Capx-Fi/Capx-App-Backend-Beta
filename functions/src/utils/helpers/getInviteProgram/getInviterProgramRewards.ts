/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function getInviterProgramRewards(
    userId: string,
    user: any
) {
  try {
    let inviterRewards = user?.invites;

    if (inviterRewards === 0) {
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: 0,
        inviteeRewards: 0,
      };
    }

    if (user?.generated_invite_code === "") {
      return {
        success: true,
        message: "NO Invite Code",
        error: "NONE",
        inviterRewards: 0,
        inviteeRewards: 0,
      };
    }

    // For each invited user. Find number of users they have invited.
    const invites = await db.collection("xusers").doc(`${userId}`).collection("invites").doc("invites").get();
    const invitesData: any = invites.data();
    if (Number(invitesData?.invited_users.length) === 0) {
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: 0,
        inviteeRewards: 0,
      };
    }

    inviterRewards = Number(invitesData?.invited_users.length);
    inviterRewards += Number(invitesData?.bonus_reward);

    // Fetch Invited users invites reward.
    let inviteeInviterRewards = 0;
    try {
      const docsRetrieval: any[] = [];
      for (let i = 0; i <= invitesData?.invited_users.length; i++) {
        const userDoc = db.collection("xusers").doc(`${invitesData?.invited_users[i]}`).collection("invites").doc("invites");
        docsRetrieval.push(userDoc);
      }

      const docs = await db.getAll(...docsRetrieval);
      for (let x = 0; x < docs.length; x++) {
        if (docs[x].exists) {
          inviteeInviterRewards += Number(docs[x].get("invited_users").length);
        }
      }
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: inviterRewards,
        inviteeRewards: inviteeInviterRewards,
      };
    } catch (err) {
      functions.logger.error(`Normal: Fetch Invited users invites reward. ${err}`);
      return {
        success: false,
        message: "ERROR: Unable to Process Request.",
        error: `Fetch Invited users invites reward. ${err}`,
      };
    }
  } catch (err) {
    functions.logger.error(`Normal: Fetch InviterProgramRewards failed. ${err}`);
    return {
      success: false,
      message: "ERROR: Unable to Process Request.",
      error: `Fetch InviterProgramRewards failed. ${err}`,
    };
  }
}


export async function getInviterProgramStats(
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

  try {
    const userId: string = token?.uid;
    const _user = await db.collection("xusers").doc(`${userId}`).get();
    if (!_user.exists) {
      return {
        success: false,
        message: "ERROR: User doesn't exist.",
        error: `User NOT Found, ${token?.uid}`,
      };
    }

    // Extract.
    const user: any = _user.data();
    let inviterRewards = Number(user?.invites);

    if (user?.generated_invite_code === "") {
      return {
        success: true,
        message: "NO Invite Code",
        error: "NONE",
        inviterRewards: 0,
        inviteStats: {
          invitesUsed: Number(0),
          invitesLeft: 0,
        },
      };
    }

    // For each invited user. Find number of users they have invited.
    const invites = await db.collection("xusers").doc(`${userId}`).collection("invites").doc("invites").get();
    const invitesData: any = invites.data();
    const maxInvites = Number(invitesData?.max_invites);
    if (Number(invitesData?.invited_users.length) === 0) {
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: 0,
        inviteStats: {
          invitesUsed: Number(0),
          invitesLeft: Number(maxInvites),
        },
      };
    }

    inviterRewards = Number(invitesData?.invited_users.length);
    const noOfInvites = Number(invitesData?.invited_users.length);
    inviterRewards += Number(invitesData?.bonus_reward);


    try {
      // Fetch Invited users invites reward.
      let inviteeInviterRewards = 0;
      const docsRetrieval: any[] = [];
      for (let i = 0; i <= invitesData?.invited_users.length; i++) {
        const userDoc = db.collection("xusers").doc(`${invitesData?.invited_users[i]}`).collection("invites").doc("invites");
        docsRetrieval.push(userDoc);
      }

      const docs = await db.getAll(...docsRetrieval);
      for (let x = 0; x < docs.length; x++) {
        if (docs[x].exists) {
          inviteeInviterRewards += Number(docs[x].get("invited_users").length);
        }
      }
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: inviterRewards+inviteeInviterRewards,
        inviteStats: {
          invitesUsed: noOfInvites,
          invitesLeft: maxInvites - noOfInvites,
        },
      };
    } catch (err) {
      functions.logger.error(`Normal: Fetch Invited users invites reward. ${err}`);
      return {
        success: false,
        message: "ERROR: Unable to Process Request.",
        error: `Fetch Invited users invites reward. ${err}`,
      };
    }
  } catch (err) {
    functions.logger.error(`Normal: Fetch InviterProgramStats failed. ${err}`);
    return {
      success: false,
      message: "ERROR: Unable to Process Request.",
      error: `Fetch InviterProgramStats failed. ${err}`,
    };
  }
}
