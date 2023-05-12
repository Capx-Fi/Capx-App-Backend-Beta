/* eslint-disable max-len */

import {db} from "../init/init";

export async function linkGoogle(
    token: any
) {
  if (token?.uid) {
    if (token?.firebase?.identities["google.com"]) {
      try {
        const _user = await db.collection("xusers").doc(token?.uid).get();
        if (_user.exists) {
          const userData = _user.data();
          if (userData?.socials["google_id"] == "") {
            // Check if the google_id is linked to any other account.
            const docs = await db.collection("xusers").where("socials.google_id", "==", token?.firebase?.identities["google.com"][0].toString()).get();
            if (docs.size === 0) {
              const res = await db.collection("xusers").doc(token?.uid).update(
                  {
                    "socials.google_id": token?.firebase?.identities["google.com"][0],
                  }
              );
              if (res) {
                // Updating Public Data
                const _userPublicData = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").get();
                if (_userPublicData.exists) {
                  const resPub = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").update(
                      {
                        "socials.google_id": token?.firebase?.identities["google.com"][0],
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
                return {success: true, message: "ERROR: Google already linked.", error: "Google already linked."};
              }
            }
            return {success: false, message: "ERROR: Google already linked to different user", error: "Google already linked to different user"};
          } else {
            return {success: true, message: "ERROR: Google already linked.", error: "Google already linked."};
          }
        }
        return {success: false, message: "ERROR: User not signed up", error: "User doesn't exist."};
      } catch (err) {
        console.log(err);
        return {success: false, message: "ERROR: Invalid Token", error: `Something Wrong happened: \nError Details: \t${err}`};
      }
    }
    return {success: false, message: "ERROR: Invalid Token", error: "Token missing Google Credentials"};
  }
  return {success: false, message: "ERROR: Invalid Token", error: "Invalid Token: missing `uid`"};
}
