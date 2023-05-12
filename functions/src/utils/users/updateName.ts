/* eslint-disable max-len */
import {db} from "../init/init";

export async function updateName(
    token: any,
    data: any
) {
  let name = "N.A";
  try {
    if (token?.uid) {
      const _user = await db.collection("xusers").doc(token?.uid).get();
      if (_user.exists) {
        name = _user.data()?.name;
        const res = await db.collection("xusers").doc(token?.uid).update(
            {
              "name": data.name,
            }
        );
        if (res) {
          // Updating Public Data
          const _userPublicData = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").get();
          if (_userPublicData.exists) {
            const resPub = await db.collection("xusers").doc(token?.uid).collection("public").doc("public").update(
                {
                  "name": data.name,
                }
            );
            if (resPub) {
              return {success: true, message: "SUCCESS: User Name updated!", error: "NONE", oldValue: name};
            } else {
              await db.collection("xusers").doc(token?.uid).update({"name": name});
              return {success: false, message: "ERROR: Unable to Update", error: "Update Public user document failed.", oldValue: name};
            }
          } else {
            await db.collection("xusers").doc(token?.uid).update({"name": name});
            return {success: false, message: "ERROR: Unable to Update", error: "User public document doesn't exist.", oldValue: name};
          }
        } else {
          return {success: false, message: "ERROR: Unable to UPDATE.", error: "Update user document failed.", oldValue: name};
        }
      } else {
        return {success: false, message: "ERROR: User not signed up", error: "User doesn't exist.", oldValue: name};
      }
    }
    return {success: false, message: "ERROR: Invalid Token!", error: "Invalid Token: missing `uid`.", oldValue: name};
  } catch (err) {
    console.log("ERROR:", err);
    return {success: false, message: "ERROR: Invalid Token", error: `Something Wrong happened: \nError Details: \t${err}`, oldValue: name};
  }
}
