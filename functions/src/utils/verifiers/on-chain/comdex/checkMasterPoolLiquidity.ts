/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    questData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_LCD_URL;

    // Master Pool ID: 1
    const poolId = Number(questData?.poolId);
    const minBlockHeight = Number(questData?.minBlockHeight);

    const isDepositor = await checkUserDepositor(
        baseURL,
        poolId,
        address,
        minBlockHeight
    );
    if (isDepositor.success) {
      const isFarmer = await checkIfUserFarmer(
          baseURL,
          poolId,
          address,
          minBlockHeight
      );
      if (isFarmer.success) {
        return {
          success: isFarmer.success,
          error: isFarmer.error,
          message: isFarmer.message,
        };
      }
      return {
        success: isFarmer.success,
        error: isFarmer.error,
        message: isFarmer.message,
      };
    }
    return {
      success: isDepositor.success,
      error: isDepositor.error,
      message: isDepositor.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Master Pool) \nError Details: \t${err}`,
    };
  }
}

async function checkUserDepositor(
    baseURL: string,
    poolId: number,
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
      `${baseURL}?events=deposit.depositor='${address}'`,
      reqOptions
  );

  try {
    if (response.ok) {
      const data: any = await response.json();
      const txs: any = data.txs;
      const txResponse: any = data.tx_responses;

      // Iterate and find the pool_id.
      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const _poolId = Number(tx?.body?.messages[0].pool_id);
        console.log(_poolId === poolId);
        if (_poolId === poolId) {
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
        message: "Liquidity not provided|Looks like you haven't added any liquidity to the Master Pool yet.",
        error: "User hasn't deposited in masterpool.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Depositor (Master Pool) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkUserDepositor (Master Pool) - ${err}`,
    };
  }
}

async function checkIfUserFarmer(
    baseURL: string,
    poolId: number,
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
      `${baseURL}?events=farm.farmer='${address}'`,
      reqOptions
  );

  try {
    if (response.ok) {
      const data: any = await response.json();
      const txs: any = data.txs;
      const txResponse: any = data.tx_responses;

      // Iterate and find the pool_id.
      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const _poolId = Number(tx?.body?.messages[0].pool_id);
        if (_poolId === poolId) {
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
        message: "Liquidity provided but rewards not farmed|You have provided liquidity to Master Pool! But you haven’t farmed yet. Please head to cSwap and farm a percentrage of your liquidity to be eligible for the xHARBOR reward.",
        error: "User hasn't farmed reward.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Farmer (Master Pool) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkIfUserFarmer (Master Pool) - ${err}`,
    };
  }
}
