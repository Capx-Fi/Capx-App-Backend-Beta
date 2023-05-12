/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    actionData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_LCD_URL;
    const minVotes = Number(actionData?.votes);
    const minBlockHeight = Number(actionData?.minBlockHeight);

    const isStaker = await checkIfVoted(
        baseURL,
        address,
        minVotes,
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
      error: `Something Wrong happened: (Proposal Votes) \nError Details: \t${err}`,
    };
  }
}

async function checkIfVoted(
    baseURL: string,
    address: string,
    minVotes: number,
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
      `${baseURL}?events=message.sender='${address}'&events=message.action='/cosmos.gov.v1beta1.MsgVote'`,
      reqOptions
  );

  try {
    if (response.ok) {
      const data: any = await response.json();
      const txs: any = data.txs;
      const txResponse: any = data.tx_responses;

      if (Number(data.pagination.total) < Number(minVotes)) {
        return {
          success: false,
          message: "User hasn't voted enough.",
          error: "User hasn't voted enough.",
        };
      }

      // Iterate.
      let count = 0;
      for (let i = 0; i < txs.length; i++) {
        const height = Number(txResponse[i].height);
        if (height >= minBlockHeight) {
          count += 1;
        }
      }
      if (count < Number(minVotes)) {
        return {
          success: false,
          message: "User hasn't voted enough.",
          error: "User hasn't voted enough.",
        };
      }
      return {
        success: true,
        message: "NONE",
        error: "NONE",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Votes (Proposal Votes) API Request.${response.statusText}`,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkIfVoted (Proposal Votes) - ${err}`,
    };
  }
}
