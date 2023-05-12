/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    actionData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_LCD_URL;
    const minBlockHeight = Number(actionData?.minBlockHeight);
    const assetDenom: string = actionData?.asset_denom;

    const isBorrower = await checkIfBorrower(
        baseURL,
        assetDenom,
        address,
        minBlockHeight
    );
    if (isBorrower.success) {
      return {
        success: isBorrower.success,
        error: isBorrower.error,
        message: isBorrower.message,
      };
    }
    return {
      success: isBorrower.success,
      error: isBorrower.error,
      message: isBorrower.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Commodo - Borrow CMST) \nError Details: \t${err}`,
    };
  }
}

async function checkIfBorrower(
    baseURL: string,
    assetDenom: string,
    address: string,
    minBlockHeight: number,
) {
  const reqOptions: any = {
    method: "GET",
    headers: {
      "accept": "application/json",
    },
    redirect: "follow",
  };

  const response = await fetch(
      `${baseURL}?events=borrow.creator='${address}'`,
      reqOptions
  );

  try {
    if (response.ok) {
      const data: any = await response.json();
      const txs: any = data.txs;
      const txResponse: any = data.tx_responses;

      // Iterate.
      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const _assetDenom: string = tx?.body?.messages[0].amount_in.denom;
        if (_assetDenom === assetDenom) {
          const height = Number(txResponse[i].height);
          if (height >= minBlockHeight) {
            return {
              success: true,
              message: "NONE",
              error: "NONE",
            };
          }
        }
      }
      return {
        success: false,
        message: "User did not borrow using CMST as collateral",
        error: "User did not borrow using CMST as collateral",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Borrow (Commodo - Borrow CMST) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - isBorrower (Commodo - Borrow CMST) - ${err}`,
    };
  }
}
