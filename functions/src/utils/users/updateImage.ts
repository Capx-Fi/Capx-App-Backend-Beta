/* eslint-disable max-len */
import {db} from "../init/init";

export async function updateImage(
    token: any,
    data: any
) {
  let userImage = "N.A";
  try {
    if (token?.uid) {
      const _user = await db.collection("xusers").doc(token?.uid).get();
      if (_user.exists) {
        userImage = _user.data()?.image_url;
        const res = await db.collection("xusers").doc(token?.uid).update(
            {
              "image_url": data.image_url,
            }
        );
        if (res) {
          // Updating Public Data
          const _userPublicData = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").get();
          if (_userPublicData.exists) {
            const resPub = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").update(
                {
                  "image_url": data.image_url,
                }
            );
            if (resPub) {
              return {success: true, message: "SUCCESS: User Image updated!", error: "NONE", oldValue: userImage};
            } else {
              await db.collection("xusers").doc(token?.uid).update({"image_url": userImage});
              return {success: false, message: "ERROR: Unable to Update", error: "Update Public user docuemnt failed.", oldValue: userImage};
            }
          } else {
            await db.collection("xusers").doc(token?.uid).update({"image_url": userImage});
            return {success: false, message: "ERROR: Unable to Update", error: "User public document doesn't exist.", oldValue: userImage};
          }
        } else {
          return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update user document failed.", oldValue: userImage};
        }
      } else {
        return {success: false, message: "ERROR: User not signed up", error: "User doesn't exist.", oldValue: userImage};
      }
    }
    return {success: false, message: "ERROR: Invalid Token!", error: "Invalid Token: missing `uid`.", oldValue: userImage};
  } catch (err) {
    console.log("ERROR:", err);
    return {success: false, message: "ERROR: Invalid Token", error: `Something Wrong happened: \nError Details: \t${err}`, oldValue: userImage};
  }
}
