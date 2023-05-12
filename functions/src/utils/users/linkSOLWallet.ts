/* eslint-disable max-len */

import {db} from "../init/init";

export async function linkSOLWallet(
    token : any,
    data: any
) {
  if (token?.uid) {
    if (data?.sol_address && data.sol_address.trim().length !== 0) {
      try {
        const _user = await db.collection("xusers").doc(token?.uid).get();
        if (_user.exists) {
          const userData = _user.data();
          if (userData?.wallets["solana"] == "") {
            const res = await db.collection("xusers").doc(token?.uid).update(
                {
                  "wallets.solana": data.sol_address,
                }
            );
            if (res) {
              return {success: true, message: "SUCCESS: Updated successful."};
            } else {
              return {success: false, message: "ERROR: Unable to UPDATE."};
            }
          } else {
            return {success: false, message: "ERROR: Wallet already linked!"};
          }
        } else {
          return {success: false, message: "ERROR: User not signed up"};
        }
      } catch (err) {
        console.log("ERROR:", err);
        return {success: false, message: "ERROR: Unable to Update"};
      }
    }
    return {success: false, message: "ERROR: Missing parameter `sol_address`"};
  } else {
    return {success: false, message: "ERROR: Invalid Auth Token!"};
  }
}
