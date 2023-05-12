/* eslint-disable max-len */
import {db} from "../init/init";

export async function linkEVMWallet(
    token : any,
    data: any
) {
  try {
    if (token?.uid) {
      if (data?.evm_address && data.evm_address.trim().length !== 0) {
        try {
          const _user = await db.collection("xusers").doc(token?.uid).get();
          if (_user.exists) {
            const userData = _user.data();
            if (userData?.wallets["evm"] == "") {
              const res = await db.collection("xusers").doc(token?.uid).update(
                  {
                    "wallets.evm": data.evm_address,
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
      return {success: false, message: "ERROR: Missing (or) Invalid parameter `evm_address`"};
    } else {
      return {success: false, message: "ERROR: Invalid Auth Token!"};
    }
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
