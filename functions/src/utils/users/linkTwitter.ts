/* eslint-disable max-len */
import {db} from "../init/init";
import {getUsernameFromId} from "../twitter/getUsernameFromId";

export async function linkTwitter(
    token: any
) {
  if (token?.uid) {
    if (token?.firebase?.identities["twitter.com"]) {
      try {
        const _user = await db.collection("xusers").doc(token?.uid).get();
        if (_user.exists) {
          const userData = _user.data();
          if (userData?.socials["twitter_id"] == "") {
            // Check if the twitter_id is linked to any other account.
            const docs = await db.collection("xusers").where("socials.twitter_id", "==", token?.firebase?.identities["twitter.com"][0].toString()).get();
            if (docs.size === 0) {
              const _username = await getUsernameFromId(token?.firebase?.identities["twitter.com"][0].toString());
              const res = await db.collection("xusers").doc(token?.uid).update(
                  {
                    "socials.twitter_id": token?.firebase?.identities["twitter.com"][0],
                    "socials.twitter_username": _username,
                  }
              );
              if (res) {
                // Updating Public Data
                const _userPublicData = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").get();
                if (_userPublicData.exists) {
                  const resPub = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").update(
                      {
                        "socials.twitter_id": token?.firebase?.identities["twitter.com"][0],
                        "socials.twitter_username": _username,
                      }
                  );
                  if (resPub) {
                    return {success: true, message: "SUCCESS: User updated.", error: "NONE"};
                  } else {
                    await db.collection("xusers").doc(token?.uid).update(userData);
                    return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update Public user document failed."};
                  }
                } else {
                  await db.collection("xusers").doc(token?.uid).update(userData);
                  return {success: false, message: "ERROR: Unable to UPDATE.", error: "User public document doesn't exist."};
                }
              } else {
                return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update user document failed."};
              }
            }
            if (docs.size === 1) {
              if (docs.docs[0].id === token?.uid) {
                return {success: true, message: "ERROR: Twitter already linked.", error: "Twitter already linked."};
              }
            }
            return {success: false, message: "ERROR: Twitter already linked to different user", error: "Twitter already linked to different user"};
          } else {
            return {success: true, message: "ERROR: Twitter already linked.", error: "Twitter already linked."};
          }
        }
        return {success: false, message: "ERROR: User not signed up", error: "User doesn't exist."};
      } catch (err) {
        console.log(err);
        return {success: false, message: "ERROR: Invalid Token", error: `Something Wrong happened: \nError Details: \t${err}`};
      }
    }
    return {success: false, message: "ERROR: Invalid Token", error: "Token missing Twitter Credentials"};
  }
  return {success: false, message: "ERROR: Invalid Token", error: "Invalid Token: missing `uid`"};
}
