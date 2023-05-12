/* eslint-disable max-len */

import {db} from "../init/init";

export async function checkUserProfile(
    token : any
) {
  if (!token?.uid) {
    return false;
  }
  try {
    // Check if username entered.
    const _user = await db.collection("xusers").doc(token?.uid).get();
    if (_user.exists) {
      const user: any = _user.data();
      if (user.name) {
        if (user.name != "") {
          if (user.image) {
            if (user.image != "") {
              if (user.socials.twitter_id) {
                if (user.socials.twitter_id != "") {
                  if (user.socials.google_id) {
                    if (user.socials.google_id != "") {
                      return true;
                    }
                    return false;
                  }
                  return false;
                }
                return false;
              }
              return false;
            }
            return false;
          }
          return false;
        }
        return false;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
