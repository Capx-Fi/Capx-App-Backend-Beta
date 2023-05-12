/* eslint-disable max-len */
import {db} from "../../init/init";
import * as functions from "firebase-functions";

export async function getOGInviterProgramRewards(
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

    if (!user?.og_invite_code || user?.og_invite_code == "") {
      return {
        success: true,
        message: "NO OG Invite Code",
        error: "NONE",
        inviterRewards: 0,
        inviteeRewards: 0,
      };
    }

    // For each invited user. Find number of users they have invited.
    const ogInvites = await db.collection("xusers").doc(`${userId}`).collection("invites").doc("og_invites").get();
    const ogInvitesData: any = ogInvites.data();
    if (Number(ogInvitesData?.invited_users) === 0) {
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: 0,
        inviteeRewards: 0,
      };
    }

    inviterRewards = Number(ogInvitesData?.invited_users);
    inviterRewards += Number(ogInvitesData?.bonus_reward);

    // Fetch Invited users invites reward.
    let inviteeInviterRewards = 0;
    try {
      const ogInviteCode: string = user?.og_invite_code;
      const inviteCode = await db.collection("xinvite_codes").doc(`${ogInviteCode}`).get();
      if (!inviteCode.exists) {
        return {
          success: false,
          message: "ERROR: Invite Code NOT found.",
          error: `Invalid OG Invite Code. ${ogInviteCode}`,
        };
      }

      const noOfInvites = Number(inviteCode.get("invited_users"));
      const maxDocId: number = Number(Math.floor(noOfInvites/20).toFixed(0)) + 1;
      const docsRetrieval: any[] = [];
      for (let i = 1; i <= maxDocId; i++) {
        const doc = db.collection("xinvite_codes").doc(ogInviteCode).collection("invited_users").doc(`${i}`);
        docsRetrieval.push(doc);
      }

      // Retrieve Docs.
      const users: any[] = [];
      try {
        const docs = await db.getAll(...docsRetrieval);
        for (let i = 0; i < docs.length; i++) {
          if (docs[i].exists) {
            const userIds: any[] = docs[i].get("user_ids");
            users.push(...userIds);
          }
        }
      } catch (err) {
        functions.logger.error(`OG: Users Retrieval Failed. ${err}`);
        return {
          success: false,
          message: "ERROR: Users Retrieval Failed.",
          error: `Users Retrieval Failed. ${err}`,
        };
      }

      // Iterate over all the users.
      for (let i = 0; i < Number(users.length/200); i++) {
        const usersDocs: any[] = [];
        const maxLength = (i+1)*200 < users?.length ? (i+1)*200 : users.length;
        for (let j = i*200; j < maxLength; j++) {
          const userDoc = db.collection("xusers").doc(`${users[j]}`).collection("invites").doc("invites");
          usersDocs.push(userDoc);
        }

        const docs = await db.getAll(...usersDocs);
        for (let x = 0; x < docs.length; x++) {
          if (docs[x].exists) {
            inviteeInviterRewards += Number(docs[x].get("invited_users").length);
          }
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
      functions.logger.error(`OG: Fetch Invited users invites reward. ${err}`);
      return {
        success: false,
        message: "ERROR: Unable to Process Request.",
        error: `Fetch Invited users invites reward. ${err}`,
      };
    }
  } catch (err) {
    functions.logger.error(`OG: Fetch OGInviterProgramRewards failed. ${err}`);
    return {
      success: false,
      message: "ERROR: Unable to Process Request.",
      error: `Fetch OGInviterProgramRewards failed. ${err}`,
    };
  }
}

export async function getOGInviterProgramStats(
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

    if (!user?.og_invite_code|| user?.og_invite_code == "") {
      return {
        success: true,
        message: "SUCCESS",
        error: "NONE",
        inviterRewards: 0,
        inviteStats: {
          invitesUsed: Number(0),
          invitesLeft: 0,
        },
      };
    }

    // For each invited user. Find number of users they have invited.
    const ogInvites = await db.collection("xusers").doc(`${userId}`).collection("invites").doc("og_invites").get();
    const ogInvitesData: any = ogInvites.data();
    const maxInvites = Number(ogInvitesData?.max_invites);
    if (Number(ogInvitesData?.invited_users) === 0) {
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

    inviterRewards = Number(ogInvitesData?.invited_users);
    inviterRewards += Number(ogInvitesData?.bonus_reward);

    // Fetch Invited users invites reward.
    let inviteeInviterRewards = 0;
    try {
      const ogInviteCode: string = user?.og_invite_code;
      const inviteCode = await db.collection("xinvite_codes").doc(`${ogInviteCode}`).get();
      if (!inviteCode.exists) {
        return {
          success: false,
          message: "ERROR: Invite Code NOT found.",
          error: `Invalid OG Invite Code. ${ogInviteCode}`,
        };
      }

      const noOfInvites = Number(inviteCode.get("invited_users"));
      const maxDocId: number = Number(Math.floor(noOfInvites/20).toFixed(0)) + 1;
      const docsRetrieval: any[] = [];
      for (let i = 1; i <= maxDocId; i++) {
        const doc = db.collection("xinvite_codes").doc(ogInviteCode).collection("invited_users").doc(`${i}`);
        docsRetrieval.push(doc);
      }

      // Retrieve Docs.
      const users: any[] = [];
      try {
        const docs = await db.getAll(...docsRetrieval);
        for (let i = 0; i < docs.length; i++) {
          if (docs[i].exists) {
            const userIds: any[] = docs[i].get("user_ids");
            users.push(...userIds);
          }
        }
      } catch (err) {
        functions.logger.error(`OG: Users Retrieval Failed. ${err}`);
        return {
          success: false,
          message: "ERROR: Users Retrieval Failed.",
          error: `Users Retrieval Failed. ${err}`,
        };
      }

      // Iterate over all the users.
      for (let i = 0; i < Number(users.length/200); i++) {
        const usersDocs: any[] = [];
        const maxLength = (i+1)*200 < users?.length ? (i+1)*200 : users.length;
        for (let j = i*200; j < maxLength; j++) {
          const userDoc = db.collection("xusers").doc(`${users[j]}`).collection("invites").doc("invites");
          usersDocs.push(userDoc);
        }

        const docs = await db.getAll(...usersDocs);
        for (let x = 0; x < docs.length; x++) {
          if (docs[x].exists) {
            inviteeInviterRewards += Number(docs[x].get("invited_users").length);
          }
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
      functions.logger.error(`OG: Fetch Invited users invites reward. ${err}`);
      return {
        success: false,
        message: "ERROR: Unable to Process Request.",
        error: `Fetch Invited users invites reward. ${err}`,
      };
    }
  } catch (err) {
    functions.logger.error(`OG: Fetch OGInviterProgramStats failed. ${err}`);
    return {
      success: false,
      message: "ERROR: Unable to Process Request.",
      error: `OG: Fetch OGInviterProgramStats failed.. ${err}`,
    };
  }
}
