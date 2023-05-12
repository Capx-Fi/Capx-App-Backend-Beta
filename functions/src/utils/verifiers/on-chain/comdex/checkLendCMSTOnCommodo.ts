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
    const assetId = Number(actionData?.asset_id);

    const isLender = await checkIfLender(
        baseURL,
        assetId,
        address,
        minBlockHeight
    );
    if (isLender.success) {
      return {
        success: isLender.success,
        error: isLender.error,
        message: isLender.message,
      };
    }
    return {
      success: isLender.success,
      error: isLender.error,
      message: isLender.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Commodo - Lend CMST) \nError Details: \t${err}`,
    };
  }
}

async function checkIfLender(
    baseURL: string,
    assetId: number,
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
      `${baseURL}?events=lend.creator='${address}'&events=lend.AssetId='${assetId}'`,
      reqOptions
  );

  try {
    if (response.ok) {
      const data: any = await response.json();
      const txs: any = data.txs;
      const txResponse: any = data.tx_responses;

      // Iterate.
      for (let i = 0; i < txs.length; i++) {
        const height = Number(txResponse[i].height);
        if (height >= minBlockHeight) {
          return {
            success: true,
            message: "NONE",
            error: "NONE",
          };
        }
      }
      return {
        success: false,
        message: "User hasn't lend CMST.",
        error: "User hasn't lend CMST.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Lend (Commodo - Lend CMST) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - isLender (Commodo - Lend CMST) - ${err}`,
    };
  }
}
