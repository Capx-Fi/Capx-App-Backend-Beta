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

    const isMinter = await checkIfMinted(
        baseURL,
        address,
        minBlockHeight
    );

    if (isMinter.success) {
      return {
        success: isMinter.success,
        error: isMinter.error,
        message: isMinter.message,
      };
    }
    return {
      success: isMinter.success,
      error: isMinter.error,
      message: isMinter.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Mint CMST by Vault) \nError Details: \t${err}`,
    };
  }
}

async function checkIfMinted(
    baseURL: string,
    address: string,
    minBlockHeight: number
) {
  const reqOptions: any = {
    method: "GET",
    headers: {
      "accept": "application/json",
    },
    redirect: "follow",
  };

  const response = await fetch(
      `${baseURL}?events=message.sender='${address}'&events=message.action='vaultV1:create'`,
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
        message: "User hasn't minted CMST using Vault.",
        error: "User hasn't minted CMST using Vault.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: "Invalid Response on Vault (Mint CMST by Vault) API Request.",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkIfMinted (Mint CMST by Vault) - ${err}`,
    };
  }
}
