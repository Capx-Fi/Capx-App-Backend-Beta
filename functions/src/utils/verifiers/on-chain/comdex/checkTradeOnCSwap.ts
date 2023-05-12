/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    actionData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_LCD_URL;

    // Quest Parameters.
    const toCheckLimit: boolean = actionData?.checkLimitOrder;
    const toCheckMarket: boolean = actionData?.checkMarketOrder;
    const minBlockHeight = Number(actionData?.minBlockHeight);

    if (toCheckLimit || toCheckMarket) {
      if (toCheckLimit) {
        const limitOrder = await checkLimitOrder(
            baseURL,
            address,
            minBlockHeight
        );
        if (!limitOrder.success) {
          return {
            success: limitOrder.success,
            error: limitOrder.error,
            message: limitOrder.message,
          };
        }
      }
      if (toCheckMarket) {
        const marketOrder = await checkMarketOrder(
            baseURL,
            address,
            minBlockHeight
        );
        if (!marketOrder.success) {
          return {
            success: marketOrder.success,
            error: marketOrder.error,
            message: marketOrder.message,
          };
        }
      }
      return {
        success: true,
        message: "NONE",
        error: "NONE",
      };
    }
    return {
      success: false,
      message: "No Trades to check.",
      error: "Quest parameter invalid.",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (CSwap Trade) \nError Details: \t${err}`,
    };
  }
}

async function checkLimitOrder(
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
      `${baseURL}?events=limit_order.orderer='${address}'`,
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
        message: "User hasn't created any Limit Order.",
        error: "User hasn't created any Limit Order.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: "Invalid Response on LimitOrder (CSwap Trade) API Request.",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkLimitOrder (CSwap Trade) - ${err}`,
    };
  }
}

async function checkMarketOrder(
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
      `${baseURL}?events=market_order.orderer='${address}'`,
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
        message: "User hasn't created any Market Order.",
        error: "User hasn't created any Market Order.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on MarketOrder (CSwap Trade) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkMarketOrder (CSwap Trade) - ${err}`,
    };
  }
}
