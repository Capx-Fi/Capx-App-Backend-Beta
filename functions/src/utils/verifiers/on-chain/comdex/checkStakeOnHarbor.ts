/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    actionData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_LCD_URL;
    const harborContract: string = actionData?.harbor_contract;
    const minBlockHeight = Number(actionData?.minBlockHeight);

    const isStaker = await checkIfStaker(
        baseURL,
        address,
        harborContract,
        minBlockHeight
    );
    if (isStaker.success) {
      return {
        success: isStaker.success,
        error: isStaker.error,
        message: isStaker.message,
      };
    }
    return {
      success: isStaker.success,
      error: isStaker.error,
      message: isStaker.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Stake Harbor) \nError Details: \t${err}`,
    };
  }
}

async function checkIfStaker(
    baseURL: string,
    address: string,
    harborContract: string,
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
      `${baseURL}?events=wasm.from='${address}'&events=wasm.action='lock'`,
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
        const contract: string = tx?.body?.messages[0].contract;
        if (contract === harborContract) {
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
        message: "User hasn't staked on Harbor.",
        error: "User hasn't staked on Harbor.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Stake (Stake Harbor) API Request. ${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkIfUserStaked (Stake Harbor) - ${err}`,
    };
  }
}
