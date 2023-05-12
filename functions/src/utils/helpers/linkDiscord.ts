/* eslint-disable max-len */
import {db} from "../init/init";
import * as functions from "firebase-functions";

export async function linkDiscord(
    uid: string,
    discordId: string,
    username: string,
    discriminator: string,
) {
  try {
    const _user = await db.collection("xusers").doc(uid).get();
    if (_user.exists) {
      const user = _user.data();
      if (user?.socials["discord_id"] === "") {
        // Check if this discord_id is linked to any other account.
        const docs = await db.collection("xusers").where("socials.discord_id", "==", discordId).get();
        if (docs.size === 0) {
          // No user with this discord ID exists.
          const updateUser = await db.collection("xusers").doc(uid).update({
            "socials.discord_id": discordId,
            "socials.discord_username": username+"#"+discriminator,
          });
          if (updateUser) {
            // Update User Public data.
            const updateUserPub = await db.collection("xusers").doc(uid).collection("public").doc("public").update({
              "socials.discord_id": discordId,
              "socials.discord_username": username+"#"+discriminator,
            });
            if (updateUserPub) {
              return {success: true, message: "Success", error: "NONE"};
            }
            functions.logger.error("Error Updating User Public document.");
            await db.collection("xusers").doc(uid).update(user);
            return {success: false, message: "ERROR: Processing Request.", error: "Error Updating User Public document."};
          }
          functions.logger.error("Error Updating User document.");
          return {success: false, message: "ERROR: Processing Request.", error: "Error Updating User document."};
        }
        if (docs.size === 1) {
          if (docs.docs[0].id === uid) {
            return {success: true, message: "Success", error: "NONE"};
          }
        }
        functions.logger.error("Provided Discord ID is already linked.");
        return {success: false, message: "Discord already Linked.", error: "Provided Discord ID is already linked to a different user."};
      }
      // Validate if the details are correct.
      if (user?.socials["discord_id"] === discordId) {
        return {success: true, message: "Success", error: "NONE"};
      }
      functions.logger.error("User trying to link multiple discord account.");
      return {success: false, message: "Discord already Linked.", error: "User trying to link multiple discord account."};
    }
    functions.logger.error("User doesn't exist");
    return {success: false, message: "User doesn't exist.", error: "User doesn't exist."};
  } catch (err) {
    functions.logger.error("Error Processing Request", err);
    return {success: false, message: "Error Process Request.", error: `Something broken. \nError Details: ${err}`};
  }
}
