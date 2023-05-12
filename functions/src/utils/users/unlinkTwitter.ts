/* eslint-disable max-len */
import {db} from "../init/init";

export async function unlinkTwitter(
    token: any
) {
  if (token?.uid) {
    try {
      const _user = await db.collection("xusers").doc(token?.uid).get();
      if (_user.exists) {
        const userData: any = _user.data();
        const res = await db.collection("xusers").doc(token?.uid).update(
            {
              "socials.twitter_id": "",
              "socials.twitter_username": "",
            }
        );
        if (res) {
          // Updating Public Data
          const _userPublicData = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").get();
          if (_userPublicData.exists) {
            const resPub = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").update(
                {
                  "socials.twitter_id": "",
                  "socials.twitter_username": "",
                }
            );
            if (resPub) {
              return {success: true, message: "SUCCESS: User updated.", error: "NONE"};
            } else {
              await db.collection("xusers").doc(token?.uid).update(userData);
              return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update Public user document failed."};
            }
          }
          await db.collection("xusers").doc(token?.uid).update(userData);
          return {success: false, message: "ERROR: Unable to UPDATE.", error: "User public document doesn't exist."};
        }
        return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update user document failed."};
      }
      return {success: false, message: "ERROR: User not signed up", error: "User doesn't exist."};
    } catch (err) {
      console.log(err);
      return {success: false, message: "ERROR: Invalid Token", error: `Something Wrong happened: \nError Details: \t${err}`};
    }
  }
  return {success: false, message: "ERROR: Invalid Token", error: "Invalid Token: missing `uid`"};
}
